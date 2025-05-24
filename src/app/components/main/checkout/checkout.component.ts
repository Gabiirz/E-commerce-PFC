import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartStateService } from '../../../service/data-access/cart-state.service';
import { CheckoutService } from '../../../service/data-access/checkout.service';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {
  private cartStateService = inject(CartStateService);
  private checkoutService = inject(CheckoutService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  cartProducts = this.cartStateService.state.products;

  totalPrice = computed(() => {
    const products = this.cartProducts();
    return products.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  });

  // Controla si mostrar el formulario
  mostrarFormulario = false;

  // Formulario reactivo
  checkoutForm: FormGroup = this.fb.group({
    direccion_calle: ['', Validators.required],
    direccion_ciudad: ['', Validators.required],
    direccion_codigo_postal: ['', Validators.required],
    direccion_pais: ['', Validators.required],
    metodo_pago: ['', Validators.required],
    nombre_tarjeta: [''],
    fecha_expiracion_tarjeta: [''],
    ultima_cuatro_tarjeta: [''],
  });

  // Al pulsar el botón Confirmar pedido se muestra el formulario
  onConfirmOrderClick() {
    const products = this.cartProducts();
    if (products.length === 0) {
      alert('El carrito está vacío, no se puede confirmar el pedido.');
      return;
    }
    this.mostrarFormulario = true;
  }

  // Cuando envían el formulario, validamos y hacemos el pedido
  async onSubmitForm() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    const products = this.cartProducts();
    const total = this.totalPrice();

    try {
      await this.checkoutService.placeOrder(products, total, this.checkoutForm.value);
      alert('Pedido confirmado con éxito!');
      this.cartStateService.clearCart();
      alert('¡Pedido realizado con éxito!');
      this.router.navigate(['/products']);
    } catch (error) {
      console.error('Error al confirmar el pedido:', error);
      alert('Hubo un error al procesar tu pedido. Por favor, inténtalo de nuevo.');
    }
  }
}
