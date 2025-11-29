import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-registrate',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './crear-cuenta.html',
  styleUrl: './crear-cuenta.css'
})
export class Registrate {

  // Campos del formulario
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  aceptaTerminos: boolean = false;

  // Estados
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificacionesService: NotificacionesService,
  ) { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  onSubmit() {
    // Limpiar mensaje de error previo
    this.errorMessage = '';

    // Validar que las contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    // Validar términos y condiciones
    if (!this.aceptaTerminos) {
      this.errorMessage = 'Debes aceptar los términos y condiciones';
      return;
    }

    this.isLoading = true;

    console.log('Intentando registrar usuario...', {
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email
    });

    // Llamar al servicio de autenticación
    this.authService.registrar({
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Registro exitoso:', response);
        this.isLoading = false;

        // ✅ Verificar si requiere verificación de email
        if (response.requiereVerificacion) {
          this.notificacionesService.exito('¡Cuenta creada! Revisa tu email para el código de verificación.');

          // Obtener idUsuario de la respuesta
          const userId = response.idUsuario;
          const userEmail = response.email || this.email;

          console.log('📧 Redirigiendo a verificación:', { userId, userEmail });

          // Redirigir a la página de verificación con los datos necesarios
          this.router.navigate(['/verificar-email'], {
            state: {
              idUsuario: userId,
              email: userEmail,
              nombre: this.nombre
            },
            queryParams: {
              idUsuario: userId,
              email: userEmail
            }
          });
        } else {
          // Si no requiere verificación (caso legacy)
          const userName = response.usuario?.nombre || this.nombre;
          this.notificacionesService.exito(`¡Bienvenido ${userName}! Tu cuenta ha sido creada.`);
          this.router.navigate(['/app/mi-dia']);
        }
      },
      error: (error) => {
        console.error('❌ Error en el registro:', error);
        this.isLoading = false;

        // Manejar caso de email ya registrado pero no verificado
        if (error.status === 409 && error.error?.requiereVerificacion) {
          this.notificacionesService.advertencia(
            error.error.message || 'Este email ya está registrado. Verifica tu cuenta.'
          );

          // Redirigir a verificación con los datos del error
          const userId = error.error.idUsuario;
          const userEmail = this.email;

          console.log('📧 Email ya registrado, redirigiendo a verificación:', { userId, userEmail });

          this.router.navigate(['/verificar-email'], {
            state: {
              idUsuario: userId,
              email: userEmail,
              nombre: this.nombre
            },
            queryParams: {
              idUsuario: userId,
              email: userEmail
            }
          });
          return;
        }

        // Mostrar mensaje de error específico
        if (error.error?.error) {
          this.errorMessage = error.error.error;
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica que esté corriendo en el puerto 3000.';
        } else {
          this.errorMessage = 'Error al crear la cuenta. Por favor intenta de nuevo.';
        }
      }
    });
  }

  onLogin() {
    this.router.navigate(['/login']);
  }
}