import { Routes } from '@angular/router';
import { LoginComponent } from './components/main/auth/login/login.component';
import { RegisterComponent } from './components/main/auth/register/register.component';
import { ProductosComponent } from './components/main/productos/productos.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: 'productos' },
  { path: 'productos', component: ProductosComponent },


  
];

