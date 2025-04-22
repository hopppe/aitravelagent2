import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client for authentication
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Authentication helper functions
export async function signUp(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data, error } = await supabaseAuth.auth.getSession();
  return { session: data.session, error };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  return { user, error };
} 