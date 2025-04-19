import { Routes } from '@angular/router';
import { LoginComponent } from './components/main/auth/login/login.component';
import { RegisterComponent } from './components/main/auth/register/register.component';
import { RedirectToLoginGuard } from './guards/redirect.guard';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
 



  {
    path: 'products', loadChildren:() =>
      import('./components/main/products/features/product-shell/product-route')
  },

  {
    path: 'cart', loadChildren:() => import('./components/main/cart/cart.routes'),
  },
  
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }


];

