import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../service/productService/product.service';
import { Product } from '../../interfaces/product.interface';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit{
  productos: Product[] = [];
  cargando = true;

  constructor(private productService: ProductService) {}

  async ngOnInit() {
    await this.cargarProductos();
  }

  async cargarProductos() {
    try {
      this.productos = await this.productService.getProductsSupa();
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      this.cargando = false;
    }
  }
}
