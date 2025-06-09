import { Component, inject, signal, computed, effect } from '@angular/core';
import { ProductStateService } from '../../../../../service/productService/product-state.service';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { CartStateService } from '../../../../../service/data-access/cart-state.service';
import { Product } from '../../../../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../service/authService/auth.service';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent, CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styles: ``,
  providers:[ProductStateService]
})
export default class ProductListComponent {
  private authService = inject(AuthService);
  
  currentPage = signal(1);
  itemsPerPage = 12;
  filteredProducts = signal<Product[]>([]);
  currentFilter = signal('all'); // Guarda el filtro actual

  pagedProducts = computed(() => {
    const all = this.filteredProducts();
    const current = this.currentFilter();
  
    if (current === 'all') {
      return all; // Solo en 'all' mostramos todo
    }
  
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
  
    return all.slice(startIndex, endIndex); // Paginado por defecto
  });
  
  
  
  

  isAdmin = false;

  constructor(private router: Router) {
    
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      const role = user?.user_metadata?.role;
      console.log('Rol del usuario:', role);
      this.isAdmin = role === 'admin'; // ✅ aquí activas el botón
    });
  }

  productEffect = effect(() => {
    this.filteredProducts.set(this.productsState.state().products);
    this.currentPage.set(1);
    this.currentFilter.set('init'); // ❗ Distinto de 'all'
  });
  
  
  productsState = inject(ProductStateService);
  cartState = inject(CartStateService).state;

  changePage(){
    const totalPages = Math.ceil(this.filteredProducts().length / this.itemsPerPage);
    if (this.currentPage() < totalPages) {
 this.currentPage.update(page => page + 1);
    } else {
 this.currentPage.set(1); // Go back to first page if at the end
    }
  }
  

  addToCart(product:Product){
    this.cartState.add({
      product,
      quantity: 1,
    });
  }

  filterProducts(keyword: string) {
    const allProducts = this.productsState.state().products || [];
    this.currentFilter.set(keyword);
    this.currentPage.set(1);
  
    if (keyword === 'all') {
      this.filteredProducts.set(allProducts); // mostrar todo sin filtro
    } else {
      const keywordMap: Record<string, string> = {
        termos: 'termo',
        hornos: 'horno',
        frigorificos: 'frigorífico',
        lavadoras: 'lavadora',
        lavavajillas: 'lavavajillas',
      };
  
      const searchTerm = keywordMap[keyword] || keyword;
      const lowerTerm = searchTerm.toLowerCase();
  
      const filtered = allProducts.filter(product => {
        const name = product.title?.toLowerCase() ?? '';
        const description = product.description?.toLowerCase() ?? '';
        return name.includes(lowerTerm) || description.includes(lowerTerm);
      });
  
      this.filteredProducts.set(filtered);
    }

  }
  
  
  
  
  

  goToAdmin() {
    console.log('🔐 Botón administrador clicado');
    console.log('isAdmin en localStorage:', localStorage.getItem('isAdmin'));
    this.router.navigate(['/admin']);
  }

// En tu componente.ts



}
