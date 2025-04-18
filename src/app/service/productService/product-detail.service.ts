import { inject, Injectable } from "@angular/core";
import { signalSlice } from "ngxtension/signal-slice";
import { Product } from "../../interfaces/product.interface";
import { ProductService } from "./product.service";
import { catchError, map, Observable, of, startWith, Subject, switchMap } from "rxjs";
import { loadESLint } from "eslint";

interface State{
    product: Product | null;
    status: 'loading' | 'sucess' | 'error';
}

export class ProductDetailService{
    private productService = inject(ProductService);
    private initialState: State = {
        product: null,
        status:'loading' as const,
      };


    state = signalSlice({
        initialState: this.initialState,
        actionSources:{
            getById:(_state, $:Observable<string>) =>$.pipe(
                switchMap((id) => this.productService.getProduct(id)),
                map(data => ({product:data, status: 'sucess' as const})),
            )
        }
    });
}