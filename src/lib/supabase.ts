import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Visit = {
  id: string;
  user_id: string;
  college_name: string;
  visit_date: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: 'draft' | 'completed';
  created_at: string;
  updated_at: string;
};

export type Photo = {
  id: string;
  visit_id: string;
  photo_url: string;
  caption: string;
  created_at: string;
};

export type Note = {
  id: string;
  visit_id: string;
  category: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Report = {
  id: string;
  visit_id: string;
  report_content: string;
  created_at: string;
};
