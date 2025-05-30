import { Routes } from '@angular/router';
import { LoginComponent } from './components/main/auth/login/login.component';
import { RegisterComponent } from './components/main/auth/register/register.component';
import { CheckoutComponent } from './components/main/checkout/checkout.component';
import { OrdersComponent } from './components/main/orders/orders.component';
import { AdminComponent } from './components/admin/admin.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
 

  { path: 'checkout', component: CheckoutComponent },


  { path: 'orders', component: OrdersComponent },


  {
    path: 'products', loadChildren:() =>
      import('./components/main/products/features/product-shell/product-route')
  },

  {
    path: 'cart', loadChildren:() => import('./components/main/cart/cart.routes'),
  },

   { path: 'admin', component: AdminComponent },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },


 



];

