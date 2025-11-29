import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-nueva-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './nueva-password.html',
  styleUrl: './nueva-password.css'
})
export class NuevaPasswordComponent implements OnInit {
  tokenTemporal: string = '';
  email: string = '';
  
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute, // 🔥 Agregar ActivatedRoute
    private authService: AuthService,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit() {
    // 🔥 CAMBIO: Leer de queryParams en lugar de state
    this.route.queryParams.subscribe(params => {
      this.tokenTemporal = params['tokenTemporal'] || '';
      this.email = params['email'] || '';
      
      console.log('🔑 Token recibido:', this.tokenTemporal ? 'Sí' : 'No'); // Debug
      
      if (!this.tokenTemporal) {
        this.notificacionesService.error('Sesión de recuperación inválida');
        this.router.navigate(['/recuperar-password']);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    this.errorMessage = '';

    // Validaciones
    if (!this.nuevaPassword || !this.confirmarPassword) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.nuevaPassword.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;

    this.authService.establecerNuevaPassword(this.tokenTemporal, this.nuevaPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        this.notificacionesService.exito('¡Contraseña actualizada exitosamente!');
        
        // Redirigir al login o a la app si ya generó token
        setTimeout(() => {
          if (response.token) {
            this.router.navigate(['/app/mi-dia']);
          } else {
            this.router.navigate(['/login']);
          }
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.error?.error === 'TOKEN_INVALIDO') {
          this.errorMessage = 'La sesión ha expirado. Por favor inicia el proceso nuevamente.';
          setTimeout(() => {
            this.router.navigate(['/recuperar-password']);
          }, 2000);
        } else {
          this.errorMessage = error.error?.mensaje || 'Error al actualizar la contraseña';
        }
      }
    });
  }

  get passwordStrength(): { level: string, color: string, text: string } {
    if (!this.nuevaPassword) {
      return { level: '', color: '', text: '' };
    }

    let strength = 0;
    
    if (this.nuevaPassword.length >= 6) strength++;
    if (this.nuevaPassword.length >= 10) strength++;
    if (/[a-z]/.test(this.nuevaPassword) && /[A-Z]/.test(this.nuevaPassword)) strength++;
    if (/\d/.test(this.nuevaPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(this.nuevaPassword)) strength++;

    if (strength <= 2) {
      return { level: 'weak', color: '#DE350B', text: 'Débil' };
    } else if (strength <= 3) {
      return { level: 'medium', color: '#FF991F', text: 'Media' };
    } else {
      return { level: 'strong', color: '#00875A', text: 'Fuerte' };
    }
  }

  get passwordsMatch(): boolean {
    if (!this.nuevaPassword || !this.confirmarPassword) {
      return true; // No mostrar error hasta que escriban
    }
    return this.nuevaPassword === this.confirmarPassword;
  }
}