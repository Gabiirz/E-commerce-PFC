import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../supabase/supabase-client.service'; // Ajusta la ruta si es necesario
import { CartStateService } from './cart-state.service'; // Ajusta la ruta si es necesario
import { ProductItemCart } from '../../interfaces/product.interface'; // Ajusta la ruta si es necesario

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private supabaseService = inject(SupabaseService);
  private cartStateService = inject(CartStateService);

  constructor() {}

  async placeOrder(products: ProductItemCart[], total: number, value: any): Promise<any> {
    try {
      // Obtener usuario autenticado
      const user = await this.supabaseService.auth.getUser();
      const userId = user.data.user?.id;
  
      if (!userId) {
        throw new Error('User not authenticated');
      }
  
      // Preparar los datos del formulario
      const datosUsuario = {
        nombre: value.nombre,
        email: value.email,
        direccion: value.direccion,
        ciudad: value.ciudad,
        codigo_postal: value.codigo_postal,
        metodo_pago: value.metodo_pago
      };
  
      // Insertar en la tabla 'pedidos'
      const { data: pedidoInsertado, error } = await this.supabaseService.supabase
        .from('pedidos')
        .insert([{
          usuario_id: userId,
          total: total,
          fecha: new Date().toISOString(),
          ...datosUsuario
        }])
        .select()
        .single();
  
      if (error) {
        throw error;
      }
  
      console.log('Pedido guardado:', pedidoInsertado);
  
      // Vaciar carrito
      this.cartStateService.clearCart();
      await this.cartStateService.clearCartInDatabase();
  
      return pedidoInsertado;
  
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }
  
}
