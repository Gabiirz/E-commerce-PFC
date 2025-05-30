import { Injectable } from '@angular/core';
import { SupabaseService } from '../../supabase/supabase-client.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(false);

  constructor(private supabaseService: SupabaseService, private router: Router) {
    console.log('AuthService initialized');
    this.checkSession(); // Al iniciar el servicio, comprobamos si hay sesión activa
  }

  // Exponemos el observable para suscribirse desde otros componentes
  get isLoggedIn$() {
    return this.loggedIn$.asObservable();
  }

  async checkSession() {
    const { data } = await this.supabaseService.auth.getUser().catch(() => ({ data: null })); // Catch potential errors like 403 when no user is logged in
    this.loggedIn$.next(!!data?.user);
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseService.auth.signUp({ email, password });
    // 2. Si el usuario se ha registrado bien, insertamos en la tabla 'usuarios'
  const supabaseUser = data.user;

    if (supabaseUser) {
    const { error: insertError } = await this.supabaseService.supabase
      .from('usuarios')
      .insert([{
        id: supabaseUser.id,           // mismo ID que en Supabase Auth
        email: email,
        password: password,          // ⚠️ Idealmente deberías cifrar esta contraseña
      }]);

    if (insertError) {
      console.error('Error insertando en tabla usuarios:', insertError);
    }
  }
    this.router.navigate(['/login']);
    return { data, error };
  }

  async logIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.auth.signInWithPassword({ email, password });
    if (data?.user) this.loggedIn$.next(true);
    return { data, error };
  }

  async signOut() {
    await this.supabaseService.auth.signOut();
    this.loggedIn$.next(false);
    localStorage.removeItem('isAdmin');  // <--- esto
    this.router.navigate(['/login']);
  }
  
  async getCurrentUserEmail(): Promise<string | null> {
    const { data } = await this.supabaseService.auth.getUser();

    return data?.user?.email ?? null;
  }

   


}

