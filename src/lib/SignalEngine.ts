import type { Signal } from '../store/useSignalStore';

export class SignalEngine {
  private static windows = [25, 50, 100, 250, 500];
  private static weights = { 25: 0.4, 50: 0.3, 100: 0.15, 250: 0.1, 500: 0.05 };

  static calculateConfidence(digits: number[], condition: (digit: number) => boolean, theoreticalProb: number): number {
    if (digits.length < 25) return 0;

    const windowStats = this.windows.map(size => {
      const slice = digits.slice(-size);
      if (slice.length === 0) return { observedProb: 0, z: 0 };

      const observedProb = slice.filter(condition).length / slice.length;
      const standardError = Math.sqrt((theoreticalProb * (1 - theoreticalProb)) / slice.length);
      const z = (observedProb - theoreticalProb) / (standardError || 1);

      return { observedProb, z };
    });

    // 1. Weighted Z-Score
    let weightedZ = 0;
    windowStats.forEach((stat, index) => {
      weightedZ += stat.z * this.weights[this.windows[index]];
    });

    // 2. Stability Factor (1 - StdDev of probabilities)
    const probs = windowStats.map(s => s.observedProb);
    const meanProb = probs.reduce((a, b) => a + b, 0) / probs.length;
    const variance = probs.reduce((a, b) => a + Math.pow(b - meanProb, 2), 0) / probs.length;
    const stability = 1 - Math.sqrt(variance);

    // 3. Z-Score to Probability Mapping
    const zConfidence = 0.5 + (Math.atan(weightedZ / 2) / Math.PI);

    const finalScore = zConfidence * stability * 100;
    return Math.min(Math.max(finalScore, 0), 100);
  }

  static getStrength(score: number): Signal['strength'] {
    if (score >= 65) return 'Very Strong';
    if (score >= 60) return 'Strong';
    if (score >= 55) return 'Min';
    return 'None';
  }

  static analyze(digits: number[]): Signal[] {
    const signals: Signal[] = [];

    // Even/Odd
    const evenConf = this.calculateConfidence(digits, d => d % 2 === 0, 0.5);
    const oddConf = this.calculateConfidence(digits, d => d % 2 !== 0, 0.5);

    if (evenConf > oddConf && evenConf >= 55) {
      signals.push({
        type: 'EVEN',
        direction: 'EVEN',
        confidence: evenConf,
        strength: this.getStrength(evenConf),
        timestamp: Date.now(),
      });
    } else if (oddConf >= 55) {
      signals.push({
        type: 'ODD',
        direction: 'ODD',
        confidence: oddConf,
        strength: this.getStrength(oddConf),
        timestamp: Date.now(),
      });
    }

    // Over/Under
    // Under 1-8
    for (let t = 1; t <= 8; t++) {
      const underConf = this.calculateConfidence(digits, d => d < t, t / 10);
      if (underConf >= 55) {
        signals.push({
          type: 'UNDER',
          threshold: t,
          direction: `UNDER ${t}`,
          confidence: underConf,
          strength: this.getStrength(underConf),
          timestamp: Date.now(),
        });
      }
    }

    // Over 1-8
    for (let t = 1; t <= 8; t++) {
      const overConf = this.calculateConfidence(digits, d => d > t, (9 - t) / 10);
      if (overConf >= 55) {
        signals.push({
          type: 'OVER',
          threshold: t,
          direction: `OVER ${t}`,
          confidence: overConf,
          strength: this.getStrength(overConf),
          timestamp: Date.now(),
        });
      }
    }

    return signals;
  }
}
