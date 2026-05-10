import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewcvrhfsijsekqjgzivw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Y3ZyaGZzaWpzZWtxamd6aXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0Mjk0NzMsImV4cCI6MjA5NDAwNTQ3M30.u1VCqNLZUrVG7vQY-PE2mcO1e0LVc2OA6d2KxrDfgcM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Functions for editais and propostas
export const getEditais = async () => {
  const { data, error } = await supabase.from('editais').select('*');
  if (error) throw error;
  return data;
};

export const saveProposta = async (titulo: string, valor: number) => {
  const { data, error } = await supabase.from('propostas').insert({ titulo, valor });
  if (error) throw error;
  return data;
};

export const getPropostas = async () => {
  const { data, error } = await supabase.from('propostas').select('*');
  if (error) throw error;
  return data;
};