import { Component, inject } from '@angular/core';
import { ProductStateService } from '../../../../../service/productService/product-state.service';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { CartStateService } from '../../../../../service/data-access/cart-state.service';
import { Product } from '../../../../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../service/authService/auth.service';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent, CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styles: ``,
  providers:[ProductStateService]
})
export default class ProductListComponent {
  private authService = inject(AuthService);
  isAdmin = false;

  constructor(private router: Router) {}

  productsState = inject(ProductStateService);
  cartState = inject(CartStateService).state;

  changePage(){
    const page = this.productsState.state.page() + 1
    this.productsState.changePage$.next(page)
  }

  addToCart(product:Product){
    this.cartState.add({
      product,
      quantity: 1,
    });
  }

  goToAdmin() {
    console.log('🔐 Botón administrador clicado');
    console.log('isAdmin en localStorage:', localStorage.getItem('isAdmin'));
    this.router.navigate(['/admin']);
  }


}
