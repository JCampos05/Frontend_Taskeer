import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';

interface VerificarEmailResponse {
  mensaje: string;
  token: string;
  usuario: any;
}

interface ReenviarCodigoResponse {
  mensaje: string;
  emailEnviado: boolean;
  intentosRestantes?: number;
}

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './verificar-email.html',
  styleUrl: './verificar-email.css'
})
export class VerificarEmailComponent implements OnInit {
  // Datos del usuario
  idUsuario: number = 0;
  email: string = '';
  nombre: string = '';
  
  // Código de verificación (6 dígitos separados)
  codigo: string[] = ['', '', '', '', '', ''];
  
  // Estados
  isLoading: boolean = false;
  isResending: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Cooldown para reenvío
  cooldownSeconds: number = 0;
  cooldownInterval: any;
  
  // Intentos restantes
  intentosRestantes: number = 3;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit() {
    // Obtener datos de la navegación o query params
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;
    
    if (state) {
      this.idUsuario = state['idUsuario'];
      this.email = state['email'];
      this.nombre = state['nombre'] || '';
    } else {
      // Intentar obtener de query params (por si refrescan la página)
      this.route.queryParams.subscribe(params => {
        this.idUsuario = parseInt(params['idUsuario'] || '0');
        this.email = params['email'] || '';
      });
    }
    
    // Verificar que tengamos los datos necesarios
    if (!this.idUsuario || !this.email) {
      this.notificacionesService.error('Datos de verificación no válidos');
      this.router.navigate(['/registrate']);
    }
  }

  ngOnDestroy() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  // Manejar input de cada dígito
  onDigitInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;
    
    // Solo permitir números
    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }
    
    this.codigo[index] = value;
    
    // Auto-focus al siguiente input
    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Si completó los 6 dígitos, verificar automáticamente
    if (index === 5 && value) {
      this.verificarCodigo();
    }
  }

  // Manejar tecla de retroceso
  onDigitKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.codigo[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  // Manejar pegado de código completo
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    for (let i = 0; i < digits.length && i < 6; i++) {
      this.codigo[i] = digits[i];
      const input = document.getElementById(`digit-${i}`) as HTMLInputElement;
      if (input) {
        input.value = digits[i];
      }
    }
    
    // Si pegó 6 dígitos, verificar
    if (digits.length === 6) {
      this.verificarCodigo();
    }
  }

  // Verificar código
  verificarCodigo() {
    const codigoCompleto = this.codigo.join('');
    
    if (codigoCompleto.length !== 6) {
      this.errorMessage = 'Por favor ingresa los 6 dígitos';
      return;
    }
    
    this.errorMessage = '';
    this.isLoading = true;
    
    this.authService.verificarEmail(this.idUsuario, codigoCompleto).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = '¡Email verificado exitosamente!';
        
        this.notificacionesService.exito('¡Bienvenido! Tu cuenta ha sido verificada');
        
        // Redirigir a la app después de 1 segundo
        setTimeout(() => {
          this.router.navigate(['/app/mi-dia']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.error?.error === 'CODIGO_INCORRECTO') {
          this.intentosRestantes = error.error.intentosRestantes || 0;
          this.errorMessage = error.error.message || 'Código incorrecto';
          this.limpiarCodigo();
        } else if (error.error?.error === 'EXPIRADO') {
          this.errorMessage = 'El código ha expirado. Solicita uno nuevo.';
          this.limpiarCodigo();
        } else if (error.error?.error === 'INTENTOS_EXCEDIDOS') {
          this.errorMessage = 'Has excedido el número de intentos. Solicita un nuevo código.';
          this.limpiarCodigo();
        } else {
          this.errorMessage = error.error?.message || 'Error al verificar el código';
        }
      }
    });
  }

  // Reenviar código
  reenviarCodigo() {
    if (this.cooldownSeconds > 0) {
      return;
    }
    
    this.errorMessage = '';
    this.successMessage = '';
    this.isResending = true;
    
    this.authService.reenviarCodigo(this.idUsuario).subscribe({
      next: (response) => {
        this.isResending = false;
        this.successMessage = '¡Código reenviado! Revisa tu email.';
        this.notificacionesService.exito('Código enviado a tu email');
        
        this.limpiarCodigo();
        this.iniciarCooldown(60); // 60 segundos de cooldown
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isResending = false;
        
        if (error.status === 429) {
          const segundos = error.error?.segundosRestantes || 60;
          this.errorMessage = error.error?.message || 'Debes esperar antes de solicitar otro código';
          this.iniciarCooldown(segundos);
        } else {
          this.errorMessage = error.error?.message || 'Error al reenviar el código';
        }
      }
    });
  }

  // Iniciar cooldown
  iniciarCooldown(seconds: number) {
    this.cooldownSeconds = seconds;
    
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    
    this.cooldownInterval = setInterval(() => {
      this.cooldownSeconds--;
      
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  // Limpiar código
  limpiarCodigo() {
    this.codigo = ['', '', '', '', '', ''];
    
    // Limpiar todos los inputs
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`digit-${i}`) as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    }
    
    // Focus en el primer input
    const firstInput = document.getElementById('digit-0') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }

  // Volver al registro
  volverAlRegistro() {
    this.router.navigate(['/registrate']);
  }

  // Formatear email (ocultar parte del email)
  get emailOfuscado(): string {
    const [local, domain] = this.email.split('@');
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  }
}