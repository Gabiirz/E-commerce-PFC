import { inject, Injectable, Signal } from "@angular/core";
import { Product, ProductItemCart } from "../../interfaces/product.interface";
import { signalSlice } from "ngxtension/signal-slice";
import { StorageService } from "./storage.service";
import { map, Observable, Subject } from "rxjs";
import { SupabaseService } from "../../supabase/supabase-client.service";
import { v4 as uuidv4 } from 'uuid'; // Importar la función para generar UUIDs



interface State{
    products: ProductItemCart[];
    loaded: boolean;
}


@Injectable({
    providedIn: 'root'
})

export class CartStateService{
    private productAdded$ = new Subject<ProductItemCart>(); // 👈 Esto faltaba

    private _storageService = inject(StorageService);
    private _supabaseService = inject(SupabaseService); // <- inyección aquí

    private initialState: State ={
        products:[],
        loaded: false,
    }
     loadProducts$ = this._storageService.loadProducts().pipe(
        map((products) => ({ products,loaded:true})),
     )
    state = signalSlice({
        initialState: this.initialState,
        sources:[this.loadProducts$],

        selectors:(state)=> ({
           count:() => state().products.reduce((acc, product) => acc + product.quantity, 0),
           price:() => {
            return state().products.reduce(
                (acc, product) => acc + product.product.price * product.quantity,
                 0,
            );
           },
        }),

        actionSources:{

            add: (state, action$: Observable<ProductItemCart>) =>
                action$.pipe(map((product) => this.add(state, product))),
            remove:(state, action$: Observable<number>) =>action$.pipe(map((id)=> this.remove(state,id))),

            update: (state, action$: Observable<ProductItemCart>) => action$.pipe(map(product => this.update(state, product)))
        },

        effects: (state) => ({
            load:() =>{
                if(state().loaded){
                    this._storageService.saveProducts(state().products);
                }
            },
        }),
    });
  actions: any;

    private add(state: Signal<State>, product: ProductItemCart){
        const isInCart = state().products.find(
            (productInCart) => productInCart.product.id === product.product.id,
        );
        if(!isInCart){
          this.addToCart(product.product, product.quantity || 1);

            return {
               products: [...state().products,{...product,quantity: 1}],
            };
        }

        isInCart.quantity += 1;
        return{
            products: [...state().products],
        }
    }
      

    private remove(state: Signal<State>, id: number){

      const product = state().products.find((p) => p.product.id === id);

      if (!product) return { products: state().products };
    
      this.removeFromCart(product.product);


        return {
            products: state().products.filter((product)=> product.product.id !== id),
        };
    }
    private update(state: Signal<State>, product: ProductItemCart){

  this.updateCartQuantity(product.product, product.quantity); // ⬅️ llamada al método


        const products = state().products.map((productInCart) => {
            if(productInCart.product.id === product.product.id){
                return {...productInCart, quantity: product.quantity}
            }

            return productInCart;
        });
        return {products};
    }


    /*-------------------- */

    private async removeFromCart(product: Product) {
      const { data: userData } = await this._supabaseService.auth.getUser();
      const userId = userData?.user?.id;
    
      if (!userId) {
        console.error('❌ No se pudo obtener el usuario');
        return;
      }
    
      const { data: productos, error: errorProducto } = await this._supabaseService.supabase
        .from('productos')
        .select('id, nombre')
        .ilike('nombre', `%${product.title}%`);
    
      if (errorProducto || !productos || productos.length === 0) {
        console.error('❌ No se encontraron productos en la base de datos');
        return;
      }
    
      const producto = productos[0];
    
      console.log('🗑️ Eliminando producto:', producto);
    
      const { error } = await this._supabaseService.supabase
        .from('carrito')
        .delete()
        .eq('usuario_id', userId)
        .eq('producto_id', producto.id);
    
      if (error) {
        console.error('❌ Error eliminando producto del carrito:', error.message);
      } else {
        console.log('✅ Producto eliminado del carrito correctamente en la base de datos');
      }
    }
    



    

  async addToCart(product: Product, quantity: number) {
    // 1. Obtener el usuario actual
    const { data: userData } = await this._supabaseService.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      console.error('❌ No se pudo obtener el usuario');
      return;
    }

    // 2. Buscar el producto por nombre
    const { data: productos, error: errorProducto } = await this._supabaseService.supabase
      .from('productos')
      .select('id, nombre')  // Seleccionamos el id y nombre del producto
      .ilike('nombre', `%${product.title}%`);  // Hacemos una búsqueda por nombre, que sea insensible a mayúsculas/minúsculas
    
    if (errorProducto || !productos || productos.length === 0) {
      console.error('❌ No se encontraron productos en la base de datos');
      return;
    }

    // Verificamos si hay productos y seleccionamos el primero que coincida
    const producto = productos[0]; // Si quieres manejar múltiples coincidencias, puedes usar otro criterio aquí

    console.log('Producto encontrado:', producto);  // Verifica qué producto fue encontrado

    // 3. Insertar en carrito
    const { error } = await this._supabaseService.supabase
      .from('carrito')
      .insert([{
        usuario_id: userId,
        producto_id: producto.id,
        cantidad: quantity,
      }]);

    if (error) {
      console.error('❌ Error insertando en carrito:', error.message);
    } else {
      console.log('✅ Producto insertado en carrito correctamente');
    }
  }


private async updateCartQuantity(product: Product, quantity: number) {
  const { data: userData } = await this._supabaseService.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    console.error('❌ No se pudo obtener el usuario');
    return;
  }

  const { data: productos, error: errorProducto } = await this._supabaseService.supabase
    .from('productos')
    .select('id, nombre')
    .ilike('nombre', `%${product.title}%`);

  if (errorProducto || !productos || productos.length === 0) {
    console.error('❌ No se encontraron productos en la base de datos');
    return;
  }

  const producto = productos[0];

  const { error } = await this._supabaseService.supabase
    .from('carrito')
    .update({ cantidad: quantity })
    .eq('usuario_id', userId)
    .eq('producto_id', producto.id);

  if (error) {
    console.error('❌ Error actualizando cantidad en carrito:', error.message);
  } else {
    console.log('✅ Cantidad actualizada correctamente en la base de datos');
  }
}


}
