import { inject, Injectable, Signal } from "@angular/core";
import { Product, ProductItemCart } from "../../interfaces/product.interface";
import { signalSlice, SignalSlice } from "ngxtension/signal-slice";
import { StorageService } from "./storage.service";
import { map, Observable, Subject, switchMap, of, catchError, tap, startWith, filter } from "rxjs";
import { SupabaseService } from "../../supabase/supabase-client.service";
import { v4 as uuidv4 } from 'uuid';


interface State{
    products: ProductItemCart[];
    loaded: boolean;
    loading: boolean;
    error: string | null;
}


@Injectable({
    providedIn: 'root'
})
export class CartStateService{
    private productAdded$ = new Subject<ProductItemCart>();
    private reloadCart$ = new Subject<void>();

    private _storageService = inject(StorageService);
    private _supabaseService = inject(SupabaseService);



    private initialState: State = {
        products: [],
        loaded: false,
        loading: false,
        error: null,
    }

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
                     console.log('Initiating cart load/reload');

                    const { data: { session } } = await this._supabaseService.auth.getSession();
                    if (!session) {
                        console.log('User not logged in, skipping cart load.');
                        return { products: [], loaded: true, loading: false, error: null };
                    }
                    const { data: userData, error: userError } = await this._supabaseService.auth.getUser();
                    const userId = userData?.user?.id;

                    if (userError) {
                        // Check if the error is due to no user logged in (403 Forbidden)
                        if (userError.status !== 403) {
                            console.error('❌ Error obteniendo usuario para cargar carrito:', userError.message);
                        } else {
                            console.log('User not logged in, skipping cart load.');
                        }
                        return { products: [], loaded: true, loading: false, error: userError.message };
                    }

                    if (!userId) {
                        console.log('No user logged in, returning empty cart state.');
                        return { products: [], loaded: true, loading: false, error: null };
                    }

                    console.log('User ID obtained:', userId, 'Fetching cart...');

                    const { data: cartItems, error: cartError } = await this._supabaseService.supabase
                        .from('carrito')
                        .select('producto_id, cantidad')
                        .eq('usuario_id', userId)
 ;

                    if (cartError) {
                        console.error('❌ Error cargando carrito desde Supabase:', cartError.message);
                        return { products: [], loaded: true, loading: false, error: cartError.message };
                    }

                    const productIds = cartItems.map(item => item.producto_id);

                    if (productIds.length === 0) {
                        console.log('No items in cart for user:', userId);
                        return { products: [], loaded: true, loading: false, error: null };
                    }

                    console.log('Product IDs in cart:', productIds, 'Fetching product details...');

                    const { data: products, error: productsError } = await this._supabaseService.supabase
                        .from('productos')
                        .select('*')
                        .in('id', productIds);

                    if (productsError) {
                        console.error('❌ Error obteniendo detalles de productos desde Supabase:', productsError.message);
                        return { products: [], loaded: true, loading: false, error: productsError.message };
                    }

                    console.log('✅ Raw product data from Supabase (check for price):', products);

                    const productsInCart: ProductItemCart[] = cartItems.map(cartItem => {
                        const productDetail = products.find(p => p.id === cartItem.producto_id);
                        return {
                            product: {
                                ...productDetail,
                                image: productDetail?.imagen_url, // Map imagen_url to image
                                price: productDetail?.precio, // Map precio to price
                                title: productDetail?.nombre
                            },
                            quantity: cartItem.cantidad,
                        };
                    }).filter(item => item.product !== undefined) as ProductItemCart[];

                    console.log('✅ Mapped productsInCart (check product.price and quantity):', productsInCart.map(item => ({ id: item.product?.id, price: item.product?.price, quantity: item.quantity })));

                    // New logic to preserve order based on current state products array
                    const currentProducts = this.state().products; // Get current state products
                    const updatedProducts: ProductItemCart[] = [];

                    // 1. Iterate through current products to maintain order and update quantities
                    for (const currentProduct of currentProducts) {
                        const updatedItem = productsInCart.find(item => item.product?.id === currentProduct.product?.id);
                        if (updatedItem) {
                            // Found in the fetched list, add with updated quantity
                            updatedProducts.push({
                                ...currentProduct, // Keep original product details and order
                                quantity: updatedItem.quantity // Use the updated quantity
                            });
                        }
                        // If not found in fetched list, it was removed, so we don't add it to updatedProducts
                    }

                    // 2. Add any new items that were not in the original state (add them at the end)
                    for (const fetchedItem of productsInCart) {
                        const existsInCurrent = currentProducts.find(item => item.product?.id === fetchedItem.product?.id);
                        if (!existsInCurrent) {
                            // This is a new item, add it to the end
                            updatedProducts.push(fetchedItem);
                        }
                    }

                    console.log('✅ Final updatedProducts list (should maintain order of previous state):', updatedProducts.map(item => ({ id: item.product?.id, quantity: item.quantity })));

                    return { products: updatedProducts, loaded: true, loading: false, error: null };
                }),
                catchError((error) => {
                    console.error('❌ Error inesperado en el pipeline de carga/recarga del carrito:', error);
                    return of({ products: [], loaded: true, loading: false, error: 'Failed to load cart.' });
                })
            );
        })
    );

    readonly state = signalSlice({
        initialState: this.initialState,
        sources: [this.loadProducts$],
        selectors: (state) => ({
           count: () => state().products.reduce((acc, product) => acc + product.quantity, 0),
           price: () => {
            return state().products.reduce(
                (acc, product) => acc + (product.product?.price || 0) * product.quantity,
                 0,
            );
           },
           isLoading: () => state().loading,
           hasError: () => state().error !== null,
           errorMessage: () => state().error,
        }),
        actionSources:{
            add: (state, action$: Observable<ProductItemCart>) =>
                action$.pipe(
                    tap(product => console.log('Action: add', product)),
                    switchMap(async (product) => {
                        await this.addToCart(product.product, product.quantity);
                        this.reloadCart$.next();
                        return state();
                    })
                ),
            remove:(state, action$: Observable<number>) =>
                action$.pipe(
                    tap(id => console.log('Action: remove', id)),
                    switchMap(async (id) => {
                        const productToRemove = state().products.find(p => p.product.id === id);
                        if (productToRemove) {
                            await this.removeFromCart(productToRemove.product);
                            this.reloadCart$.next();
                        } else {
                            console.warn(`Attempted to remove product with ID ${id} but it was not found in the current state.`);
                        }
                        return state();
                    })
                ),
            update: (state, action$: Observable<ProductItemCart>) =>
                action$.pipe(
                    tap(product => console.log('Action: update', product)),
                    switchMap(async (product) => { 
                    
                        await this.updateCartQuantity(product.product.id, product.quantity);
                        this.reloadCart$.next();
                        return state();
                    })
                )
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
       // ... (lógica existente) ...
        const { data: userData } = await this._supabaseService.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
            console.error('❌ No se pudo obtener el usuario para eliminar producto del carrito');
            return;
        }

 console.log('🗑️ Eliminando producto:', product.id, 'del carrito para usuario:', userId);
 const { error } = await this._supabaseService.supabase
 .from('carrito')
 .delete()
 .eq('usuario_id', userId)
 .eq('producto_id', product.id);
        if (error) {
            console.error('❌ Error eliminando producto del carrito:', error.message);
        } else {
            console.log('✅ Producto eliminado del carrito correctamente en la base de datos');
        }
    }

    async addToCart(product: Product, quantity: number) {
        const { data: userData } = await this._supabaseService.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
            console.error('❌ No se pudo obtener el usuario para añadir al carrito');
            return;
        }

        const { data: productos, error: errorProducto } = await this._supabaseService.supabase
            .from('productos')
            .select('id')
            .ilike('nombre', `%${product.title}%`);

        if (errorProducto || !productos || productos.length === 0) {
            console.error('❌ No se encontraron productos en la base de datos para añadir al carrito');
            return;
        }

        const producto = productos[0];

        console.log('Debug - addToCart:');
 console.log('  - userId:', userId);
 console.log('  - producto.id (from search):', producto.id);

        console.log('✅ Producto encontrado para añadir:', producto.id);

        const { data: existingItems, error: existingItemsError } = await this._supabaseService.supabase
            .from('carrito')
            .select('id, cantidad')
            .eq('usuario_id', userId)
            .eq('producto_id', producto.id);

        if (existingItemsError) {
            console.error('❌ Error verificando producto existente en carrito:', existingItemsError.message);
 return;
        }

 const existingItem = existingItems?.[0];

        if (existingItem) {
 console.log('  - existingItem found:', existingItem); // This log might show undefined if existingItems is empty
            console.log('Producto ya en el carrito, actualizando cantidad.');
            await this.updateCartQuantity(producto.id, existingItem.cantidad + quantity);
        }
     else {
            console.log('Producto no en el carrito, insertando.');
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
 console.log('Debug - addToCart: End of method');
    }

 private async updateCartQuantity(productoId: number, quantity: number) {
        const { data: userData } = await this._supabaseService.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
            console.error('❌ No se pudo obtener el usuario para actualizar cantidad del carrito');
            return;
        }

 console.log('🔄 Actualizando cantidad del producto:', productoId, 'a', quantity, 'para usuario:', userId);

        const { error } = await this._supabaseService.supabase
            .from('carrito')
            .update({ cantidad: quantity })
            .eq('usuario_id', userId)
 .eq('producto_id', productoId);

 if (error) {
            console.error('❌ Error actualizando cantidad en carrito:', error.message);
        } else {
            console.log('✅ Cantidad actualizada correctamente en la base de datos');
        }
    }
}
