import { Component, effect, inject, input } from '@angular/core';
import { ProductDetailService } from '../../../../../service/productService/product-detail.service';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../../../interfaces/product.interface';
import { CartStateService } from '../../../../../service/data-access/cart-state.service';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe],
  templateUrl: './product-detail.component.html',
  styles: ``,
  providers: [ProductDetailService]
})
export  default class ProductDetailComponent {
cartState = inject(CartStateService).state;
productDetailState = inject(ProductDetailService).state;
id = input.required<string>();

constructor(){
  effect(()=>{
    this.productDetailState.getById(this.id())
    
  });
}

addToCart(){
  this.cartState.add({
    product:this.productDetailState.product()!,
    quantity:1 ,
  });
}

}
