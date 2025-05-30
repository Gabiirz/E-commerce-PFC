import { Component, OnInit } from '@angular/core'; // Importa OnInit
import { CheckoutService } from '../../../service/data-access/checkout.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  standalone: true, // Probablemente necesites que sea standalone
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit { // Implementa OnInit
  pedido: any[] = []; // Usamos any[] porque la estructura es anidada
  cargando = true;
  error: string | null = null; // Para mostrar posibles errores

  constructor(private checkoutService: CheckoutService) {}

  ngOnInit(): void {
    this.checkoutService.getUserOrders()
      .then(data => {
        this.pedido = data;
        console.log('Pedidos cargados:', this.pedido); // Verifica la estructura aquí
        this.cargando = false;
      })
      .catch(error => {
        console.error('Error al cargar pedidos:', error);
        this.error = 'Error al cargar tus pedidos. Inténtalo de nuevo más tarde.'; // Mensaje para el usuario
        this.cargando = false;
      });
  }
}
