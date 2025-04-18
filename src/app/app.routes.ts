import { Routes } from '@angular/router';
import { LoginComponent } from './components/main/auth/login/login.component';
import { RegisterComponent } from './components/main/auth/register/register.component';
import ProductListComponent from './products/features/product-list/product-list.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
 

  

  {
    path: '', loadChildren:() =>
      import('./products/features/product-shell/product-route')
  },

  {
    path: 'cart', loadChildren:() => import('./components/main/cart/cart.routes'),
  },
  
  { path: '**', redirectTo: '' },

  
];

