import { inject, Injectable, Signal } from "@angular/core";
import { Product, ProductItemCart } from "../../interfaces/product.interface";
import { signalSlice, SignalSlice } from "ngxtension/signal-slice";
import { StorageService } from "./storage.service";
import { map, Observable, Subject, switchMap, of, catchError, tap, startWith, filter } from "rxjs";
import { SupabaseService } from "../../supabase/supabase-client.service";
import { v4 as uuidv4 } from 'uuid';

interface State {
    products: ProductItemCart[];
    loaded: boolean;
    loading: boolean;
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class CartStateService {
    private productAdded$ = new Subject<ProductItemCart>();
    private reloadCart$ = new Subject<void>();

    private _storageService = inject(StorageService);
    private _supabaseService = inject(SupabaseService);

    private initialState: State = {
        products: [],
        loaded: false,
        loading: false,
        error: null,
    };

    loadProducts$ = new Observable<[any, any]>((subscriber) => {
        const { data: subscription } = this._supabaseService.auth.onAuthStateChange(
            (event: any, session: any) => {
                subscriber.next([event, session]);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }).pipe(
        filter(([event, session]) => session !== null),
        map(([event, session]) => session),
        switchMap(session => {
            return this.reloadCart$.pipe(
                startWith(null),
                switchMap(async () => {
                    const { data: { session } } = await this._supabaseService.auth.getSession();
                    if (!session) return { products: [], loaded: true, loading: false, error: null };

                    const { data: userData, error: userError } = await this._supabaseService.auth.getUser();
                    const userId = userData?.user?.id;
                    if (userError && userError.status !== 403) return { products: [], loaded: true, loading: false, error: userError.message };
                    if (!userId) return { products: [], loaded: true, loading: false, error: null };

                    const { data: cartItems, error: cartError } = await this._supabaseService.supabase
                        .from('carrito')
                        .select('producto_id, cantidad')
                        .eq('usuario_id', userId);

                    if (cartError) return { products: [], loaded: true, loading: false, error: cartError.message };

                    const productIds = cartItems.map(item => item.producto_id);
                    if (productIds.length === 0) return { products: [], loaded: true, loading: false, error: null };

                    const { data: products, error: productsError } = await this._supabaseService.supabase
                        .from('productos')
                        .select('*')
                        .in('id', productIds);

                    if (productsError) return { products: [], loaded: true, loading: false, error: productsError.message };

                    const productsInCart: ProductItemCart[] = cartItems.map(cartItem => {
                        const productDetail = products.find(p => p.id === cartItem.producto_id);
                        return {
                            product: {
                                ...productDetail,
                                image: productDetail?.imagen_url,
                                price: productDetail?.precio,
                                title: productDetail?.nombre
                            },
                            quantity: cartItem.cantidad,
                        };
                    }).filter(item => item.product !== undefined) as ProductItemCart[];

                    const currentProducts = this.state().products;
                    const updatedProducts: ProductItemCart[] = [];

                    for (const currentProduct of currentProducts) {
                        const updatedItem = productsInCart.find(item => item.product?.id === currentProduct.product?.id);
                        if (updatedItem) {
                            updatedProducts.push({ ...currentProduct, quantity: updatedItem.quantity });
                        }
                    }

                    for (const fetchedItem of productsInCart) {
                        const existsInCurrent = currentProducts.find(item => item.product?.id === fetchedItem.product?.id);
                        if (!existsInCurrent) updatedProducts.push(fetchedItem);
                    }

                    return { products: updatedProducts, loaded: true, loading: false, error: null };
                }),
                catchError((error) => of({ products: [], loaded: true, loading: false, error: 'Failed to load cart.' }))
            );
        })
    );

    readonly state = signalSlice({
        initialState: this.initialState,
        sources: [this.loadProducts$],
        selectors: (state) => ({
            count: () => state().products.reduce((acc, product) => acc + product.quantity, 0),
            price: () => state().products.reduce((acc, product) => acc + (product.product?.price || 0) * product.quantity, 0),
            isLoading: () => state().loading,
            hasError: () => state().error !== null,
            errorMessage: () => state().error,
        }),
        actionSources: {
            add: (state, action$: Observable<ProductItemCart>) =>
                action$.pipe(
                    map((product) => {
                        const currentState = state();
                        const existing = currentState.products.find(p => p.product.id === product.product.id);
            
                        let updatedProducts: ProductItemCart[];
                        if (existing) {
                            updatedProducts = currentState.products.map(p =>
                                p.product.id === product.product.id
                                    ? { ...p, quantity: p.quantity + product.quantity }
                                    : p
                            );
                        } else {
                            updatedProducts = [...currentState.products, product];
                        }
            
                        // ⚠️ Llamada a Supabase en segundo plano
                        this.addToCart(product.product, product.quantity);
            
                        // ✅ Retornamos el nuevo estado inmediatamente
                        return { ...currentState, products: updatedProducts };
                    })
                ),
            
            
            remove: (state, action$: Observable<number>) =>
                action$.pipe(
                    switchMap(async (id) => {
                        const productToRemove = state().products.find(p => p.product.id === id);
                        if (productToRemove) {
                            await this.removeFromCart(productToRemove.product);
                            this.reloadCart$.next();
                        }
                        return state();
                    })
                ),
                update: (state, action$: Observable<ProductItemCart>) =>
                    action$.pipe(
                        map((product) => {
                            const currentState = state();
                            const updatedProducts = currentState.products.map(p =>
                                p.product.id === product.product.id
                                    ? { ...p, quantity: product.quantity }
                                    : p
                            );
                
                            // ⚠️ Llamada a Supabase en segundo plano
                            this.updateCartQuantity(product.product.id, product.quantity);
                
                            // ✅ Retornamos el nuevo estado al instante
                            return { ...currentState, products: updatedProducts };
                        })
                    ),

                clear: (state, action$: Observable<void>) =>
                        action$.pipe(
                            map(() => ({
                                ...state(),
                                products: []
                            }))
                        ),
                    
                
                
        },
        effects: (state) => ({
            saveCartToStorage: () => {
                if (state().loaded && !state().loading && !state().error) {
                    this._storageService.saveProducts(state().products);
                }
            }
        }),
    });

    private async removeFromCart(product: Product) {
        const { data: userData } = await this._supabaseService.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;

        await this._supabaseService.supabase
            .from('carrito')
            .delete()
            .eq('usuario_id', userId)
            .eq('producto_id', product.id);
    }

    async addToCart(product: Product, quantity: number) {
        const { data: userData } = await this._supabaseService.auth.getUser();
        const userId = userData?.user?.id;
    
        if (!userId) {
            console.error('❌ No se pudo obtener el usuario para añadir al carrito');
            return;
        }
    
        const productoId = product.id;
    
        try {
            const { error } = await this._supabaseService.supabase
                .rpc('incrementar_cantidad_carrito', {
                    usuario_id_input: userId,
                    producto_id_input: productoId,
                    cantidad_a_sumar: quantity
                });
    
            if (error) {
                console.error('❌ Error al ejecutar RPC incrementar_cantidad_carrito:', error.message);
            } else {
                console.log('✅ Producto añadido o actualizado correctamente con RPC');
            }
        } catch (e) {
            console.error('❌ Error inesperado en addToCart con RPC:', e);
        }
    }
    
    

    private async updateCartQuantity(productoId: number, quantity: number) {

        
              const { data: userData } = await this._supabaseService.auth.getUser();
        const userId = userData?.user?.id;
    
        if (!userId) return;
    
        // ✅ Actualiza siempre con la cantidad más reciente del estado local
        const currentQuantity = this.state().products.find(p => p.product.id === productoId)?.quantity;
    
        await this._supabaseService.supabase
            .from('carrito')
            .update({ cantidad: currentQuantity }) // usamos valor local más reciente
            .eq('usuario_id', userId)
            .eq('producto_id', productoId);
            
            // Dentro de la clase CartStateService

          
  
    }
   
  



    async clearCartInDatabase() {
        const { data: userData } = await this._supabaseService.auth.getUser();
        const userId = userData?.user?.id;
      
        if (!userId) return;
      
        await this._supabaseService.supabase
          .from('carrito')
          .delete()
          .eq('usuario_id', userId);
      }      
    clearCart() {
        this.state.clear(); // Esto dispara la acción
    }
    
      
      
      
      



    
    
} 