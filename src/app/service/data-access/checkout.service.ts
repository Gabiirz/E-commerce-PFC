import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../supabase/supabase-client.service';
import { CartStateService } from './cart-state.service';
import { ProductItemCart, Product } from '../../interfaces/product.interface'; // Make sure Product is imported

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private supabaseService = inject(SupabaseService);
  private cartStateService = inject(CartStateService);

  constructor() {}

  async placeOrder(products: ProductItemCart[], total: number,value: any, subtotalAmount: number, savingsAmount: number, ivaAmount: number ): Promise<any> {
    try {
      // Obtener usuario autenticado
      const user = await this.supabaseService.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const numero_tarjeta = value.numero_tarjeta.replace(/\s+/g, ''); // Quitar espacios

      // RECORDATORIO IMPORTANTE -> No guardes CVV o fecha de caducidad en tu base de datos, ni siquiera temporalmente. Esto puede violar normativas como PCI DSS.

      const datosUsuario = {
        nombre: value.nombre,
        email: value.email,
        codigo_postal: value.codigo_postal,
        direccion_calle: value.direccion_calle,
        direccion_ciudad: value.direccion_ciudad,
        direccion_pais: value.direccion_pais,
        metodo_pago: value.metodo_pago,
        metodo_entrega: value.metodo_entrega, // ojo que esté igual en formulario y aquí
        nombre_tarjeta: value.nombre_tarjeta,
        fecha_expiracion_tarjeta: value.fecha_expiracion_tarjeta,
        numero_tarjeta: numero_tarjeta, // Aquí el número limpio
        // cvv_tarjeta: value.cvv_tarjeta,
        telefono: value.telefono,
      };

      // 1. Insertar el pedido principal en la tabla 'pedidos'
      const { data: pedidoInsertado, error: orderError } = await this.supabaseService.supabase
        .from('pedidos') // Asegúrate de que este es el nombre correcto de tu tabla de pedidos
        .insert([
          {
            usuario_id: userId,
            total: total,
            fecha: new Date().toISOString(),
            precio_original: subtotalAmount, // ¿Coincide EXACTO con el nombre de la columna en Supabase?
            descuento: savingsAmount,       // ¿Coincide EXACTO con el nombre de la columna en Supabase?
            iva: ivaAmount,                 // ¿Coincide EXACTO con el nombre de la columna en Supabase?
            ...datosUsuario,
          },
        ])
        .select() // Seleccionar el pedido insertado para obtener su ID
        .single();

      if (orderError) {
        console.error('Error al insertar el pedido principal:', orderError); // Added logging
        throw orderError;
      }

      console.log('Pedido principal guardado:', pedidoInsertado);

      const orderId = pedidoInsertado.id; // Obtener el ID del pedido recién insertado

      // 2. Preparar los datos para insertar en 'detallepedido'
      const detallePedidoItems = products.map(item => {
        console.log('Preparing item for detallepedido:', {
          pedido_id: orderId,
          producto_id: item.product.id,
          cantidad: item.quantity,
          precio_unitario: item.product.price,
        }); // Add this log
        return {
          pedido_id: orderId,
          producto_id: item.product.id,
          cantidad: item.quantity,
          precio_unitario: item.product.price,
        };
      });
  

      console.log('Items a insertar en detallepedido:', detallePedidoItems); // Added logging

      // 3. Insertar los items en la tabla 'detallepedido'
      const { error: detallePedidoError } = await this.supabaseService.supabase
        .from('detallepedido') // Asegúrate de que este es el nombre correcto de tu tabla de detalle de pedido
        .insert(detallePedidoItems);

      if (detallePedidoError) {
        console.error('Error al insertar los items en detallepedido:', detallePedidoError); // Added logging
        // Consider handling this error more robustly, maybe deleting the inserted order
        throw detallePedidoError;
      }

      console.log('Detalles del pedido guardados en detallepedido');


      // Vaciar carrito
      this.cartStateService.clearCart();
      await this.cartStateService.clearCartInDatabase();

      return pedidoInsertado;

    } catch (error) {
      console.error('Error general al procesar el pedido:', error); // Added logging
      throw error;
    }
  }

  async getUserOrders(): Promise<any[]> {
    const user = await this.supabaseService.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabaseService.supabase
      .from('pedidos')
      .select(`
        id,
        total,
        fecha,
        precio_original,  
        descuento,        
        iva,             
        detallepedido (
          cantidad,
          precio_unitario,
          producto:producto_id (
            id,
            nombre,
            imagen_url,
            precio
          )
        )
      `)
      .eq('usuario_id', userId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener pedidos del usuario:', error);
      throw error;
    }

    // console.log('Datos recibidos de Supabase en getUserOrders:', data); // Útil para depurar

    return data;
  }
}

