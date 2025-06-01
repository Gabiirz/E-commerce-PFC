import { Component, inject } from '@angular/core'; 

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../service/authService/auth.service';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink,CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  
  constructor(private authService: AuthService, private router: Router) {}


  correoNoVerificado: boolean = false;


  loginForm = new FormGroup({
    email: new FormControl<any>('', [Validators.required, Validators.email]),
    password: new FormControl<any>('', [Validators.required])
  });

  async onSubmit() {
  
   this.authService.logIn(this.loginForm.value.email, this.loginForm.value.password)
   .then ((resp: any) => {
    console.log(resp)

    if (resp.error) {
      if (resp.error.message.includes('Email not confirmed')) {
        this.correoNoVerificado = true;
        return; // salir para que no haga más nada
      } else {
        console.error('Error al iniciar sesión:', resp.error.message);
        return;
      }
    }

    
    if(resp.data.user.user_metadata?.role === "admin"){
      this.router.navigate(['products']); // O la ruta para admins que tengas
    } else if(resp.data.user.role === "authenticated") {
      this.router.navigate(['products']);
    }
   })
   .catch((err: any) =>{
    console.log(err)
   })
  }
  

  async ngOnInit() {
    await this.authService.signOut(); // <-- cerrar sesión automáticamente al entrar al login
  }
}
