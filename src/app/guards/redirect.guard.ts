import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/authService/auth.service';

@Injectable({ providedIn: 'root' })
export class RedirectToLoginGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  async canActivate(): Promise<boolean> {
    await this.authService.signOut(); // Cerramos sesión
    this.router.navigate(['/login']); // Redirigimos al login
    return false; // Evitamos que se cargue la ruta vacía
  }
}

