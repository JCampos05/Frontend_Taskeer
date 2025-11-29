import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../../core/services/authentication/authentication';
import { NotificacionesService } from '../../../core/services/notification/notification';

// 🎯 ESTADOS DEL FLUJO
type EstadoFlujo = 'inicial' | 'validando' | 'esperando_codigo' | 'codigo_verificado' | 'cambiando';

@Component({
  selector: 'app-seguridad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seguridad.html',
  styleUrl: './seguridad.css'
})
export class SeguridadComponent implements OnInit, OnDestroy {
  formPassword!: FormGroup;
  usuario: Usuario | null = null;

  // Estados del componente
  estadoFlujo: EstadoFlujo = 'inicial';
  guardandoPassword = false;
  mostrarPasswordActual = false;
  mostrarPasswordNuevo = false;
  mostrarPasswordConfirmar = false;

  // Modal de verificación
  mostrarModalVerificacion = false;
  codigoVerificacion: string[] = ['', '', '', '', '', ''];
  verificandoCodigo = false;
  reenviandoCodigoModal = false;
  modalSuccessMessage = '';
  modalErrorMessage = '';
  modalIntentosRestantes = 3;
  modalCooldownSeconds = 0;
  modalCooldownInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificacionesService: NotificacionesService
  ) { }

  ngOnInit() {
    this.inicializarFormulario();
    this.cargarUsuario();
  }

  ngOnDestroy() {
    if (this.modalCooldownInterval) {
      clearInterval(this.modalCooldownInterval);
    }
  }

  inicializarFormulario() {
    this.formPassword = this.fb.group({
      passwordActual: ['', [Validators.required]],
      passwordNuevo: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(6)]],
      passwordConfirmar: [{ value: '', disabled: true }, [Validators.required]]
    }, { validators: this.passwordsCoinciden });
  }

  cargarUsuario() {
    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.usuario = this.authService.obtenerUsuarioActual();
      }
    });
  }

  // ============================================
  // PASO 1: VALIDAR CONTRASEÑA ACTUAL Y ENVIAR CÓDIGO
  // ============================================

  async cambiarPassword() {
    // Solo validar passwordActual en este paso
    const passwordActual = this.formPassword.get('passwordActual')?.value;
    
    if (!passwordActual) {
      this.notificacionesService.error('Ingresa tu contraseña actual');
      return;
    }

    this.estadoFlujo = 'validando';
    this.guardandoPassword = true;

    try {
      // 1️⃣ Validar contraseña actual
      console.log('🔐 Validando contraseña actual...');
      await this.authService.validarPasswordActual(passwordActual).toPromise();
      console.log('✅ Contraseña válida');

      // 2️⃣ Enviar código al email
      if (!this.usuario?.idUsuario) {
        throw new Error('No se pudo obtener el ID de usuario');
      }

      console.log('📧 Enviando código de verificación...');
      await this.authService.solicitarCodigoCambioPassword().toPromise(); 
      
      this.guardandoPassword = false;
      this.estadoFlujo = 'esperando_codigo';
      this.notificacionesService.exito('Código enviado a tu email');

      // 3️⃣ Mostrar modal de verificación
      this.mostrarModalVerificacion = true;

      // Focus en el primer input después de un pequeño delay
      setTimeout(() => {
        const firstInput = document.getElementById('modal-digit-0') as HTMLInputElement;
        firstInput?.focus();
      }, 100);

    } catch (error: any) {
      this.guardandoPassword = false;
      this.estadoFlujo = 'inicial';

      if (error.error?.error === 'PASSWORD_INCORRECTO' || error.error?.mensaje?.includes('incorrecta')) {
        this.notificacionesService.error('Contraseña actual incorrecta');
      } else if (error.status === 429) {
        const segundos = error.error?.segundosRestantes || 60;
        this.notificacionesService.advertencia(`Debes esperar ${segundos} segundos antes de solicitar otro código`);
      } else {
        this.notificacionesService.error(error.error?.mensaje || 'Error al validar contraseña');
      }
    }
  }

  // ============================================
  // PASO 2: MODAL DE VERIFICACIÓN DEL CÓDIGO
  // ============================================

  cerrarModalVerificacion() {
    this.mostrarModalVerificacion = false;
    this.limpiarCodigoModal();
    this.modalSuccessMessage = '';
    this.modalErrorMessage = '';
    this.estadoFlujo = 'inicial';

    if (this.modalCooldownInterval) {
      clearInterval(this.modalCooldownInterval);
      this.modalCooldownSeconds = 0;
    }
  }

  onModalOverlayClick(event: MouseEvent) {
    // Cerrar solo si se hace click en el overlay
    if (event.target === event.currentTarget) {
      this.cerrarModalVerificacion();
    }
  }

  onModalContainerClick(event: MouseEvent) {
    event.stopPropagation();
  }

  onModalDigitInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }

    this.codigoVerificacion[index] = value;

    if (value && index < 5) {
      const nextInput = document.getElementById(`modal-digit-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    if (index === 5 && value) {
      this.verificarCodigoModal();
    }
  }

  onModalDigitKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.codigoVerificacion[index] && index > 0) {
      const prevInput = document.getElementById(`modal-digit-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  }

  onModalPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    for (let i = 0; i < digits.length && i < 6; i++) {
      this.codigoVerificacion[i] = digits[i];
      const input = document.getElementById(`modal-digit-${i}`) as HTMLInputElement;
      if (input) {
        input.value = digits[i];
      }
    }

    if (digits.length === 6) {
      this.verificarCodigoModal();
    }
  }

  verificarCodigoModal() {
    const codigoCompleto = this.codigoVerificacion.join('');

    if (codigoCompleto.length !== 6) {
      this.modalErrorMessage = 'Por favor ingresa los 6 dígitos';
      return;
    }

    if (!this.usuario?.idUsuario) {
      this.modalErrorMessage = 'Error al obtener datos del usuario';
      return;
    }

    this.modalErrorMessage = '';
    this.verificandoCodigo = true;

    this.authService.verificarEmail(this.usuario.idUsuario, codigoCompleto).subscribe({
      next: () => {
        this.verificandoCodigo = false;
        this.modalSuccessMessage = '¡Código verificado correctamente!';
        
        console.log('✅ Código verificado, habilitando campos de nueva contraseña');

        // 🎉 Cerrar modal y habilitar campos de nueva contraseña
        setTimeout(() => {
          this.cerrarModalVerificacion();
          this.estadoFlujo = 'codigo_verificado';
          
          // Habilitar campos de nueva contraseña
          this.formPassword.get('passwordNuevo')?.enable();
          this.formPassword.get('passwordConfirmar')?.enable();
          
          this.notificacionesService.exito('Ahora puedes ingresar tu nueva contraseña');
        }, 1000);
      },
      error: (error) => {
        this.verificandoCodigo = false;

        if (error.error?.error === 'CODIGO_INCORRECTO') {
          this.modalIntentosRestantes = error.error.intentosRestantes || 0;
          this.modalErrorMessage = error.error.message || 'Código incorrecto';
          this.limpiarCodigoModal();
        } else if (error.error?.error === 'EXPIRADO') {
          this.modalErrorMessage = 'El código ha expirado. Solicita uno nuevo.';
          this.limpiarCodigoModal();
        } else {
          this.modalErrorMessage = error.error?.message || 'Error al verificar el código';
        }
      }
    });
  }

  reenviarCodigoModal() {
    if (this.modalCooldownSeconds > 0 || !this.usuario?.idUsuario) {
      return;
    }

    this.modalErrorMessage = '';
    this.modalSuccessMessage = '';
    this.reenviandoCodigoModal = true;

    this.authService.reenviarCodigo(this.usuario.idUsuario).subscribe({
      next: () => {
        this.reenviandoCodigoModal = false;
        this.modalSuccessMessage = '¡Código reenviado! Revisa tu email.';
        this.limpiarCodigoModal();
        this.iniciarCooldownModal(60);

        setTimeout(() => {
          this.modalSuccessMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.reenviandoCodigoModal = false;

        if (error.status === 429) {
          const segundos = error.error?.segundosRestantes || 60;
          this.modalErrorMessage = 'Debes esperar antes de solicitar otro código';
          this.iniciarCooldownModal(segundos);
        } else {
          this.modalErrorMessage = 'Error al reenviar el código';
        }
      }
    });
  }

  iniciarCooldownModal(seconds: number) {
    this.modalCooldownSeconds = seconds;

    if (this.modalCooldownInterval) {
      clearInterval(this.modalCooldownInterval);
    }

    this.modalCooldownInterval = setInterval(() => {
      this.modalCooldownSeconds--;
      if (this.modalCooldownSeconds <= 0) {
        clearInterval(this.modalCooldownInterval);
      }
    }, 1000);
  }

  limpiarCodigoModal() {
    this.codigoVerificacion = ['', '', '', '', '', ''];

    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`modal-digit-${i}`) as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    }

    const firstInput = document.getElementById('modal-digit-0') as HTMLInputElement;
    firstInput?.focus();
  }

  // ============================================
  // PASO 3: EJECUTAR CAMBIO DE CONTRASEÑA
  // ============================================

  async ejecutarCambioPassword() {
    if (this.formPassword.invalid) {
      this.notificacionesService.error('Por favor completa todos los campos correctamente');
      return;
    }

    if (this.estadoFlujo !== 'codigo_verificado') {
      this.notificacionesService.error('Primero debes verificar tu email');
      return;
    }

    const { passwordActual, passwordNuevo } = this.formPassword.value;
    this.estadoFlujo = 'cambiando';
    this.guardandoPassword = true;

    try {
      await this.authService.cambiarPassword({
        passwordActual,
        passwordNuevo
      }).toPromise();

      this.notificacionesService.exito('Contraseña actualizada correctamente');
      this.formPassword.reset();
      this.mostrarPasswordActual = false;
      this.mostrarPasswordNuevo = false;
      this.mostrarPasswordConfirmar = false;
      this.estadoFlujo = 'inicial';
      this.guardandoPassword = false;
      
      // Deshabilitar campos nuevamente
      this.formPassword.get('passwordNuevo')?.disable();
      this.formPassword.get('passwordConfirmar')?.disable();
    } catch (error: any) {
      this.guardandoPassword = false;
      this.estadoFlujo = 'codigo_verificado';
      const mensaje = error.error?.error || error.error?.mensaje || 'Error al cambiar contraseña';
      this.notificacionesService.error(mensaje);
    }
  }

  cancelarCambiosPassword() {
    this.formPassword.reset();
    this.mostrarPasswordActual = false;
    this.mostrarPasswordNuevo = false;
    this.mostrarPasswordConfirmar = false;
    this.estadoFlujo = 'inicial';
    
    // Deshabilitar campos de nueva contraseña
    this.formPassword.get('passwordNuevo')?.disable();
    this.formPassword.get('passwordConfirmar')?.disable();
  }

  // ============================================
  // VALIDADORES
  // ============================================

  passwordsCoinciden(group: AbstractControl): ValidationErrors | null {
    const nuevo = group.get('passwordNuevo')?.value;
    const confirmar = group.get('passwordConfirmar')?.value;
    return nuevo === confirmar ? null : { noCoinciden: true };
  }

  validarLongitud(): boolean {
    const password = this.formPassword.get('passwordNuevo')?.value;
    return password && password.length >= 6;
  }

  validarMayuscula(): boolean {
    const password = this.formPassword.get('passwordNuevo')?.value;
    return password && /[A-Z]/.test(password);
  }

  validarMinuscula(): boolean {
    const password = this.formPassword.get('passwordNuevo')?.value;
    return password && /[a-z]/.test(password);
  }

  validarNumero(): boolean {
    const password = this.formPassword.get('passwordNuevo')?.value;
    return password && /[0-9]/.test(password);
  }

  get emailOfuscado(): string {
    if (!this.usuario?.email) return '';
    const [local, domain] = this.usuario.email.split('@');
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  }

  // 🎯 GETTER PARA SABER QUÉ BOTÓN MOSTRAR
  get textoBotonPrincipal(): string {
    switch (this.estadoFlujo) {
      case 'inicial':
      case 'validando':
        return this.guardandoPassword ? 'Validando...' : 'Validar y Enviar Código';
      case 'codigo_verificado':
      case 'cambiando':
        return this.guardandoPassword ? 'Cambiando...' : 'Cambiar Contraseña';
      default:
        return 'Cambiar Contraseña';
    }
  }

  get deshabilitarBotonPrincipal(): boolean {
    if (this.guardandoPassword) return true;
    
    if (this.estadoFlujo === 'inicial' || this.estadoFlujo === 'validando') {
      return !this.formPassword.get('passwordActual')?.value;
    }
    
    if (this.estadoFlujo === 'codigo_verificado' || this.estadoFlujo === 'cambiando') {
      return this.formPassword.invalid;
    }
    
    return true;
  }

  onSubmitForm() {
    if (this.estadoFlujo === 'inicial' || this.estadoFlujo === 'validando') {
      this.cambiarPassword();
    } else if (this.estadoFlujo === 'codigo_verificado' || this.estadoFlujo === 'cambiando') {
      this.ejecutarCambioPassword();
    }
  }
}