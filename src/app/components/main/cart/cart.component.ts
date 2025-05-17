import { Component, inject, computed } from '@angular/core';
import { CartStateService } from '../../../service/data-access/cart-state.service';
import { CartItemComponent } from './ui/cart-item/cart-item.component';
import { ProductItemCart } from '../../../interfaces/product.interface';
import { CurrencyPipe, NgIf, NgForOf, AsyncPipe } from '@angular/common';


@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CartItemComponent,
    CurrencyPipe,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export default class CartComponent {
  private cartService = inject(CartStateService);

  // Accede a las señales de estado, selectores y acciones directamente en cartService.state
  cartState = this.cartService.state;

  orderedCartProducts = computed(() => {
    const products = this.cartState.products();
    return [...products].sort((a, b) => a.product.id - b.product.id);
  });

  // Selector computado local para el precio total
  totalPrice = computed(() => {
    return this.cartState.products().reduce(
      (acc, productItem) => acc + (productItem.product?.price || 0) * productItem.quantity,
      0
    );
  });


  onRemove(id: number): void {
    // Llama a la acción remove directamente desde cartService.state
    this.cartService.state.remove(id);
  }

  onIncrease(productItem: ProductItemCart): void {
    // Llama a la acción update directamente desde cartService.state
    this.cartService.state.update({
      product: productItem.product,
      quantity: productItem.quantity + 1,
    });
    console.log('After onIncrease - total price:', this.totalPrice());
    console.log('After onIncrease - cart products:', this.cartState.products());
    const forceUpdate = this.totalPrice(); // Accessing to potentially force update
  }

  onDecrease(productItem: ProductItemCart): void {
    if (productItem.quantity > 1) {
      // Llama a la acción update directamente desde cartService.state
      this.cartService.state.update({
        ...productItem,
        quantity: productItem.quantity - 1,
      });
    } else {
        this.onRemove(productItem.product.id);
    }
    console.log('After onDecrease - total price:', this.totalPrice());
    console.log('After onDecrease - cart products:', this.cartState.products());    const forceUpdate = this.totalPrice(); // Accessing to potentially force update
  }
}
