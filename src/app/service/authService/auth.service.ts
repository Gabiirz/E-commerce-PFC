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

  get isLoggedIn$() {
    return this.loggedIn$.asObservable();
  }


  private user$ = new BehaviorSubject<any>(null);

  get currentUser$() {
    return this.user$.asObservable();
  }


  async checkSession() {
    const { data } = await this.supabaseService.auth.getUser().catch(() => ({ data: null }));
    const user = data?.user;
    this.loggedIn$.next(!!user);
    this.user$.next(user || null); // ← Esta línea permite al guard ver el user y su role
  }
  

  async getCurrentUserRole(): Promise<string | null> {
    const result = await this.supabaseService.auth.getUser();
    const user = result.data?.user;
    return user?.user_metadata?.role ?? null;
  }
  
  
  


  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseService.auth.signUp({ email, password });
  const supabaseUser = data.user;

  let insertError = null;


    if (supabaseUser) {
      const insertResult = await this.supabaseService.supabase
      .from('usuarios')
      .insert([{
        id: supabaseUser.id,          
        email: email,
        password: password,         
      }]);

      insertError = insertResult.error; // ✅ Aquí guardas el error correctamente


      if (insertError) {
        console.error('Error insertando en tabla usuarios:', insertError);
      } 
    }    return { data, error, insertError  };
  }

  async logIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.auth.signInWithPassword({ email, password });
  
    if (error) {
      console.error('❌ Error al iniciar sesión:', error.message);
      return { data: null, error };
    }
  
    const user = data.user;
  
    // ✅ Obtener el rol desde la tabla 'usuarios'
    const { data: usuarioData, error: usuarioError } = await this.supabaseService.supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single();
  
    if (usuarioError) {
      console.error('❌ Error al obtener rol del usuario:', usuarioError.message);
    }
  
    // ✅ Asignar el rol (aunque sea en memoria)
    user.user_metadata = {
      ...user.user_metadata,
      role: usuarioData?.role ?? 'user'
    };
  
    // ✅ Actualizar estado global
    this.loggedIn$.next(true);
    this.user$.next(user);
  
    return { data: { user }, error: null };
  }
  
  

  async signOut() {
    await this.supabaseService.auth.signOut();
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }
  
  async getCurrentUserEmail(): Promise<string | null> {
    const { data } = await this.supabaseService.auth.getUser();

    return data?.user?.email ?? null;
  }

   


}

