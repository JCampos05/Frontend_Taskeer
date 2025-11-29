import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // Campos del formulario
  email: string = '';
  password: string = '';
  remember: boolean = false;
  
  // Estados
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificacionesService: NotificacionesService 
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    // Limpiar mensaje de error previo
    this.errorMessage = '';
    this.isLoading = true;

    // Llamar al servicio de autenticación
    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.isLoading = false;
        // Obtener el nombre del usuario desde la respuesta

        // Obtener el usuario actual del servicio de autenticación
        const usuarioActual = this.authService.obtenerUsuarioActual();
        const nombreUsuario = usuarioActual?.nombre || 'Usuario';
      
        // Mostrar notificación de bienvenida
        this.notificacionesService.exito(`¡Bienvenido de nuevo, ${nombreUsuario}!`);
        // Redirigir a la aplicación principal
        this.router.navigate(['/app/mi-dia']);
      },
      error: (error) => {
        console.error('Error en el login:', error);
        this.isLoading = false;
        
        // Mostrar mensaje de error específico
        if (error.error?.error) {
          this.errorMessage = error.error.error;
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica que esté corriendo en el puerto 3000.';
        } else if (error.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Por favor intenta de nuevo.';
        }
      }
    });
  }

  onForgotPassword() {
    console.log('Recuperar contraseña');
    //alert('Funcionalidad de recuperación de contraseña pendiente.');
    this.router.navigate(['/recuperar-password']);
  }

  onSignup() {
    this.router.navigate(['/registrate']);
  }
}