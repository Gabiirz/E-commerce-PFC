import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartStateService } from '../../../service/data-access/cart-state.service';
import { CheckoutService } from '../../../service/data-access/checkout.service';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {
  private cartStateService = inject(CartStateService);
  private checkoutService = inject(CheckoutService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  cartProducts = this.cartStateService.state.products;
  prefijoSeleccionado = '+1';
  mostrarDropdown = false;
  mostrarFormulario = false;

  checkoutForm: FormGroup;

  savings = signal(0); // Señal para el monto del descuento aplicado
  ivaPercent = 0.21; // Porcentaje de IVA fijo
  metodoEntrega = signal<'rapida' | 'gratuita'>('gratuita');
  
  // Señal computada para el subtotal
  subtotal = computed(() => {
    const products = this.cartProducts();
    return products.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  });

  costeEntrega = computed(() => this.metodoEntrega() === 'rapida' ? 15 : 0);

  setMetodoEntrega(metodo: 'rapida' | 'gratuita') {
    this.metodoEntrega.set(metodo);
  }



  // Señal computada para el total (incluyendo subtotal, descuento e IVA)
  total = computed(() => {
    const subtotalVal = this.subtotal();
    const savingsVal = this.savings();
    const iva = (subtotalVal - savingsVal) * this.ivaPercent;
    return subtotalVal - savingsVal + iva + this.costeEntrega();
  });

  voucherError = false;
  voucherSuccess = false;

  constructor() {
    this.checkoutForm = this.fb.group({
      telefono_prefijo: [this.prefijoSeleccionado, Validators.required],
      nombre: ['', Validators.required],
      email: ['', [
        Validators.required, 
        Validators.email, 
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|yahoo\.es)$/)
      ]],
      direccion_calle: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z0-9\s,'-]{5,}$/)
      ]],
    
      direccion_ciudad: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z\s]{2,}$/)
      ]],

      direccion_pais: ['', Validators.required],
      codigo_postal: ['', [
          Validators.required, 
          Validators.pattern(/^\d{4,6}$/)
        ]],
        
      metodo_pago: ['', Validators.required],
      metodo_entrega: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9,}$/)]],
      voucher: [''],

      // Campos de tarjeta con validadores
      nombre_tarjeta: ['', [Validators.required, Validators.minLength(3)]],
      fecha_expiracion_tarjeta: ['', [Validators.required, this.validarFechaFutura.bind(this)]],
      cvv_tarjeta: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      numero_tarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    });
  }
  minMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  validarFechaFutura(control: AbstractControl) {

    if (!control.value) return null;
    // El input type="month" da valor en formato YYYY-MM
    const [year, month] = control.value.split('-').map(Number);
    const fecha = new Date(year, month - 1);
    const ahora = new Date();
    ahora.setDate(1); // solo mes y año
    ahora.setHours(0, 0, 0, 0);
    if (fecha < ahora) {
      return { fechaValida: true };
    }
    return null;
  }
  


  ngOnInit(): void {
    this.mostrarFormulario = false;
    localStorage.removeItem('mostrarFormulario');
    this.checkoutForm.reset({
      telefono_prefijo: this.prefijoSeleccionado
    });
    
  }

  

  seleccionarPrefijo(prefijo: string) {
    this.prefijoSeleccionado = prefijo;
    this.checkoutForm.get('telefono_prefijo')?.setValue(prefijo);
    this.mostrarDropdown = false;
  }

  alternarDropdown() {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  checkVoucher() {
    const code = this.checkoutForm.get('voucher')?.value.trim().toUpperCase();

    if (!code) {
      this.savings.set(0);
      this.voucherSuccess = false;
      this.voucherError = false;
      return;
    }

    if (code === 'DISCOUNT10') {
      this.savings.set(this.subtotal() * 0.10); // Calcula el descuento basado en el subtotal
      this.voucherSuccess = true;
      this.voucherError = false;
    } else {
      this.savings.set(0);
      this.voucherSuccess = false;
      this.voucherError = true;
    }
  }

  resetVoucherStatus() {
    this.voucherError = false;
    this.voucherSuccess = false;
    this.savings.set(0);
  }

  applyVoucher() {
    if (!this.voucherSuccess) {
      alert('Por favor, comprueba que el código es válido antes de aplicar.');
      return;
    }

    // El descuento ya se calcula en checkVoucher, applyVoucher solo asegura que se ha validado
    // Puedes añadir lógica adicional aquí si es necesario, pero el cálculo principal está en checkVoucher
    console.log('Voucher aplicado. Descuento:', this.savings());
  }


  onConfirmOrderClick() {
    const camposIniciales = [
      'telefono_prefijo',
      'nombre',
      'email',
      'codigo_postal',
      'direccion_calle',
      'direccion_ciudad',
      'direccion_pais',
      'metodo_pago',
      'metodo_entrega',
      'telefono'
    ];

    const inicialesValidos = camposIniciales.every(campo => this.checkoutForm.get(campo)?.valid);

    if (!inicialesValidos) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.mostrarFormulario = true;
    localStorage.setItem('mostrarFormulario', 'true');
  }

  async onSubmitForm() {
    // Limpia espacios del número de tarjeta para que el pattern valide bien
    const numeroControl = this.checkoutForm.get('numero_tarjeta');
    if (numeroControl && numeroControl.value) {
      const valorLimpio = numeroControl.value.replace(/\s+/g, '');
      numeroControl.setValue(valorLimpio, { emitEvent: false });
    }

    this.checkoutForm.markAllAsTouched();
    Object.values(this.checkoutForm.controls).forEach(control => control.updateValueAndValidity());

    if (this.checkoutForm.invalid) {
      console.log('Formulario inválido. Detalle de errores:');
      Object.entries(this.checkoutForm.controls).forEach(([key, control]) => {
        if (control.invalid) {
          console.log(`- Campo '${key}' inválido. Errores:`, control.errors);
        }
      });
      return;
    }

    // Aquí continua la lógica para enviar el pedido
    console.log('Formulario válido, enviando datos...');
    const products = this.cartProducts();
    if (products.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const total = this.total();
    // **Obtener los valores calculados de las señales computadas del componente**
    const subtotalAmount = this.subtotal(); // Obtener el monto del subtotal
    const savingsAmount = this.savings();   // Obtener el monto del descuento
    const ivaAmount = (subtotalAmount - savingsAmount) * this.ivaPercent; // **Calcular el monto real de IVA aquí**


    try {
      // **Pasar los valores calculados a placeOrder**
      await this.checkoutService.placeOrder(
        products,
        total,
        this.checkoutForm.value,
        subtotalAmount,  // Pasar el subtotal
        savingsAmount,   // Pasar el monto del descuento
        ivaAmount        // Pasar el monto de IVA calculado
      );
      alert('Pedido confirmado con éxito!');
      this.cartStateService.clearCart();
      localStorage.removeItem('mostrarFormulario');
      this.router.navigate(['/products']);
    } catch (error) {
      console.error(error);
      alert('Error al procesar el pedido.');
    }
  }
}
