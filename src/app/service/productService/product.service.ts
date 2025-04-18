import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseHttpService } from '../data-access/base-http.service';
import { Product } from '../../interfaces/product.interface';
import { Observable } from 'rxjs';

const LIMIT = 5;

@Injectable(
 {providedIn: 'root'}
)
export class ProductService extends BaseHttpService{



  getProducts(page:number):Observable<Product[]>{
    return this.http.get<any[]>(`${this.apiUrl}/products`,{
      params:{
        limit: page * LIMIT,
      }
    });
  }

  getProduct(id:string): Observable<Product>{
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }
}
