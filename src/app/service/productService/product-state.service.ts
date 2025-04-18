import { inject, Injectable } from "@angular/core";
import { signalSlice } from "ngxtension/signal-slice";
import { Product } from "../../interfaces/product.interface";
import { ProductService } from "./product.service";
import { catchError, map, of, startWith, Subject, switchMap } from "rxjs";

interface State{
    products: Product[];
    status: 'loading' | 'sucess' | 'error';
    page:number;
}

export class ProductStateService{
    private productService = inject(ProductService);
    private initialState: State = {
        products:[],
        status:'loading' as const,
        page:1,
      };

      changePage$ = new Subject<number>();

      loadProducts$ = this.changePage$.pipe(
        startWith(1),
        switchMap((page) => this.productService.getProducts(page)),
        map((products)=>({products,status:'sucess' as const})),
        catchError(() => {
          return of({
            products: [],
            status: 'error' as const,
          });
        })
      );

      state = signalSlice({
        initialState: this.initialState,
        sources:[
            this.changePage$.pipe(
              map((page) => ({ page, status: 'loading' as const})),
            ),
            this.loadProducts$
        ],
      });

}