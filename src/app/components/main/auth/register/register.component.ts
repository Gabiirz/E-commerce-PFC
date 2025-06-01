import { Component } from '@angular/core';
import { AuthService } from '../../../../service/authService/auth.service';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  constructor(private authService: AuthService, private router: Router) {} // 👈 Aquí también

  registerForm = new FormGroup({
    email: new FormControl<any>('', [Validators.required, Validators.email]),
    password: new FormControl<any>('', [ Validators.required,
      Validators.minLength(8),
      Validators.maxLength(32),
      Validators.pattern(/^(?=.*[a-z])(?=.*\d).+$/)]),

    confirmPassword: new FormControl<string | null>('', [
        Validators.required
      ])
    },{
      validators: matchPasswordsValidator
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      console.warn('Formulario inválido');
      return;
    }
  
    const { email, password } = this.registerForm.value;
  
    this.authService.signUp(email!, password!)
    .then((resp: any) => {
      const hasSignUpError = !!resp.error;
      const hasInsertError = !!resp.insertError;
  
      if (!hasSignUpError && !hasInsertError) {
        this.router.navigate(['/login']); // ✅ Solo si TODO fue bien
      } else {
        if (hasInsertError) {
          console.error('❌ Error al insertar en la tabla usuarios:', resp.insertError);
        }
        if (hasSignUpError) {
          console.error('❌ Error en registro con Supabase:', resp.error);
        }
      }
    })
    .catch((err: any) => {
      console.error('❌ Error inesperado:', err);
    });
  
  }
  



}
 export function matchPasswordsValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
  
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
