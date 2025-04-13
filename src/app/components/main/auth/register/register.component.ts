import { Component } from '@angular/core';
import { AuthService } from '../../../../service/authService/auth.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  router: any;
  constructor(private authService: AuthService) {}

  registerForm = new FormGroup({
    email: new FormControl<any>('', [Validators.required, Validators.email]),
    password: new FormControl<any>('', [Validators.required])
  });

  onSubmit() {
   this.authService.signUp(this.registerForm.value.email, this.registerForm.value.password)
   .then ((resp: any) => {
    console.log(resp)
    
   })
   .catch((err: any) =>{
    console.log(err)
   })
  }
}

