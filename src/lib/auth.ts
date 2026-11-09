import { createClient } from '@supabase/supabase-js';

// These are now hardcoded for your project to ensure it works immediately
const SUPABASE_URL = 'https://loxsgotrohmeafhkcpqr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jrnRxcMm4uNZsHhPhPoHAA_ZxRbXWeg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authService = {
  async signUp(email: string) {
    const { data, error } = await supabase
      .from('users')
      .upsert({ email, is_active: false }, { onConflict: 'email' });

    if (error) throw error;
    return data;
  },

  async login(email: string, code: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('access_code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('Invalid email or access code');
    }
    return data;
  }
};
