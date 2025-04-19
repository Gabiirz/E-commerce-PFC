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

  loginForm = new FormGroup({
    email: new FormControl<any>('', [Validators.required, Validators.email]),
    password: new FormControl<any>('', [Validators.required])
  });

  onSubmit() {
   this.authService.logIn(this.loginForm.value.email, this.loginForm.value.password)
   .then ((resp: any) => {
    console.log(resp)
    if(resp.data.user.role === "authenticated"){
      
      this.router.navigate(['products'])

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
