import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseHttpService } from '../data-access/base-http.service';
import { Product } from '../../interfaces/product.interface';
import { firstValueFrom, Observable } from 'rxjs';
import { SupabaseService } from '../../supabase/supabase-client.service';

const LIMIT = 5;

@Injectable(
 {providedIn: 'root'}
)
export class ProductService extends BaseHttpService{
  constructor(private supabaseService: SupabaseService) {
    super();
  }
  

  getProducts(page:number):Observable<Product[]>{
    return this.http.get<any[]>(`${this.apiUrl}/products`,{
      params:{
        limit: page * LIMIT,
      }
    });
  }

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await this.supabaseService.supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();
  
    if (error || !data) {
      throw new Error('Producto no encontrado');
    }
  
    return {
      id: data.id,
      title: data.nombre,
      description: data.descripcion,
      price: data.precio,
      image: data.imagen_url,
      category: data.categoria ?? 'general',
      rating: {
        rate: 5,
        count: 10,
      }
    };
  }
  
  

/*----*/

async insertProductToSupabase(product: Product): Promise<void> {
  // Asegurarse de que el producto tiene el formato adecuado
  const transformedProduct = {
    nombre: product.title,        // Renombrar 'title' a 'nombre'
    descripcion: product.description, // 'description' a 'descripcion'
    precio: product.price,        // 'price' a 'precio'
    imagen_url: product.image,    // 'image' a 'imagen_url'
  };

  const { data, error } = await this.supabaseService.supabase
  .from('productos')
  .insert([transformedProduct])
  .select(); // esto trae de vuelta el producto insertado

if (error) {
  throw error;
}

const insertedProduct = data[0];
console.log('✅ Producto insertado con id:', insertedProduct.id);

}

async getProductsSupa(): Promise<Product[]> {
  const { data, error } = await this.supabaseService.supabase
    .from('productos')
    .select('*');

  if (error) {
    throw error;
  }

  return data.map((p: any) => ({
    id: p.id,
    title: p.nombre,
    description: p.descripcion,
    price: p.precio,
    image: p.imagen_url,
    category: p.categoria || 'general', // puedes ajustar esto si lo agregas a tu tabla
    rating: {
      rate: 5,
      count: 10
    } // valor por defecto
  })) as Product[];
}

async getProductSupa(id: string): Promise<Product | null> {
  const { data, error } = await this.supabaseService.supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .maybeSingle(); // ✅ esto evita lanzar error si no hay resultado

  if (error) {
    console.error('Error al obtener producto:', error);
    return null;
  }

  if (!data) {
    console.warn('⚠️ Producto no encontrado en Supabase para ID:', id);
    return null;
  }

  return data;
}


async updateProductInSupabase(id: string, product: Partial<Product>): Promise<void> {
  const { error } = await this.supabaseService.supabase
    .from('productos')
    .update(product)
    .eq('id', id);

  if (error) {
    throw error;
  }
}

async deleteProductFromSupabase(id: string): Promise<void> {
  const { error } = await this.supabaseService.supabase
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}


  /*async migrateProductsToSupabase() { MIGRAR PRODUCTOS A SUPABASE DE FAKEAPI
    try {
      const response = await firstValueFrom(
        this.http.get<Product[]>(`${this.apiUrl}/products`)
      );

      // Transformar los productos al formato que espera tu tabla
      const transformedProducts = response.map((p) => ({
        nombre: p.title,
        descripcion: p.description,
        precio: p.price,
        imagen_url: p.image,
      }));

      const { error } = await this.supabaseService.supabase
        .from('productos')
        .insert(transformedProducts);

      if (error) {
        console.error('Error insertando productos en Supabase:', error);
      } else {
        console.log('Productos insertados correctamente en Supabase');
      }
    } catch (e) {
      console.error('Error en la migración:', e);
    }
  }*/
}
