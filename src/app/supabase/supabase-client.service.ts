import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  from(arg0: string) {
    throw new Error('Method not implemented.');
  }
 
  private supabaseUrl = 'https://toodpallyyueukyxfkju.supabase.co'; // Tu URL real
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvb2RwYWxseXl1ZXVreXhma2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTY2OTgsImV4cCI6MjA1OTc5MjY5OH0.ZEKL3XaR9cljDA_COyCH-4jisjjF-7Z3NN9F-_VQzaQ'; // Tu clave pública (anon)
  
  public supabase: SupabaseClient;
  auth: any;
  static auth: any;

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.auth = this.supabase.auth; // Asigna auth correctamente

  }

  
}


