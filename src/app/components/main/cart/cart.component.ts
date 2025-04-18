import { Component, inject } from '@angular/core';
import { CartStateService } from '../../../service/data-access/cart-state.service';
import { CartItemComponent } from './ui/cart-item/cart-item.component';
import { ProductItemCart } from '../../../interfaces/product.interface';
import { CurrencyPipe } from '@angular/common';


@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CartItemComponent, CurrencyPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export default class CartComponent {
  state = inject(CartStateService).state;

  onRemove(id: number){
    this.state.remove(id);
  }

  onIncrease(product:ProductItemCart){
    this.state.update({
      product: product.product,
      quantity: product.quantity + 1,
    });
  }

  onDecrease(product:ProductItemCart){
    this.state.update({
     ...product,
     quantity: product.quantity - 1,
    });
  }
}
