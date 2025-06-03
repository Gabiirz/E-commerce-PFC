import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../service/productService/product.service';
import { Product } from '../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  standalone: true, 
  selector: 'app-admin',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit{
  productos: Product[] = [];
  cargando = true;
  mostrarFormulario: boolean = false;
  modoEdicion: boolean = false;
  productoFormulario: any = { nombre: '', descripcion: '', precio: 0, imagen_url: '' };

  public log(message: string): void {
    console.log(message);
  }

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

  async editarProducto(producto: Product): Promise<void> {
    this.mostrarFormulario = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.modoEdicion = true;
    console.log('Editar producto:', producto);
  
    this.productoFormulario = {
      id: producto.id,
      nombre: producto.title,
      descripcion: producto.description,
      precio: producto.price,
      imagen_url: producto.image
    };
  }
  
  eliminarProducto(productoId: number): void {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      console.log('Eliminar producto con ID:', productoId);
      // Convertir el ID numérico de tu interfaz a string para pasarlo al servicio de Supabase
      this.productService.deleteProductFromSupabase(productoId.toString())
        .then(() => {
          console.log('Producto eliminado con éxito');
          this.cargarProductos(); // Refrescar la lista después de eliminar
        })
        .catch((error: any) => console.error('Error al eliminar producto:', error));
    }
  }

  agregarProducto(): void {
    this.mostrarFormulario = true;
    this.modoEdicion = false;
    console.log('Intentando agregar nuevo producto');
    // Inicializa el formulario para un nuevo producto (con valores vacíos o por defecto)
    this.productoFormulario = { nombre: '', descripcion: '', precio: 0, imagen_url: '' };
  }

  async guardarProducto(): Promise<void> {
    console.log('Guardando producto:', this.productoFormulario);
    try {
      // Mapear los datos del formulario (que usa nombres de Supabase)
      // a la estructura de la interfaz Product para el servicio,
      // ya que tu servicio espera Partial<Product> o Product.
      const datosParaService: Partial<Product> = {
 title: this.productoFormulario.nombre, // Mapeo de formulario (Supabase name) a Product interface name
 description: this.productoFormulario.descripcion,
 price: this.productoFormulario.precio,
 image: this.productoFormulario.imagen_url,
 // No se incluyen otras propiedades de Product como category, rating, etc., a menos que quieras poder editarlas.
      };

      if (this.modoEdicion) {
        // Modo edición: Llama al servicio de actualización con el ID y los datos
        // Asegúrate de que tu servicio updateProductInSupabase maneje el id como string
 await this.productService.updateProductInSupabase(this.productoFormulario.id.toString(), datosParaService);
        console.log('Producto actualizado con éxito');
      } else {
        // Modo añadir: Llama al servicio de inserción con los datos
        // Asumimos que insertProductToSupabase espera un objeto con la misma estructura de Product
        // Si tu servicio espera la estructura de Supabase (nombre, descripcion...), necesitas mapear aquí al revés
 await this.productService.insertProductToSupabase(datosParaService as Product); // Podría necesitar ajuste si tu insert espera otro tipo
        console.log('Producto añadido con éxito');
      }
      this.mostrarFormulario = false; // Ocultar el formulario
      await this.cargarProductos(); // Refrescar la lista
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
    }
  }

  cancelarEdicion(): void {
    this.mostrarFormulario = false; // Ocultar el formulario sin guardar
  }
}