import { Component, effect, inject, input } from '@angular/core';
import { ProductDetailService } from '../../../service/productService/product-detail.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe],
  templateUrl: './product-detail.component.html',
  styles: ``,
  providers: [ProductDetailService]
})
export  default class ProductDetailComponent {

  productDetailState = inject(ProductDetailService).state;
id = input.required<string>();

constructor(){
  effect(()=>{
    this.productDetailState.getById(this.id())
    
  });
}

}
