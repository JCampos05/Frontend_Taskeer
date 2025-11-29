import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService, Usuario } from '../../../core/services/authentication/authentication';
import { NotificacionesService } from '../../../core/services/notification/notification';

@Component({
  selector: 'app-redes-sociales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './redes-sociales.html',
  styleUrl: './redes-sociales.css'
})
export class RedesSocialesComponent implements OnInit {
  formRedes!: FormGroup;
  usuario: Usuario | null = null;
  guardandoRedes = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
    this.cargarUsuario();
  }

  inicializarFormulario() {
    this.formRedes = this.fb.group({
      linkedin: ['', [this.urlValidator]],
      github: ['', [this.urlValidator]],
      twitter: ['', [this.urlValidator]],
      youtube: ['', [this.urlValidator]],
      reddit: ['', [this.urlValidator]],
      instagram: ['', [this.urlValidator]]
    });
  }

  cargarUsuario() {
    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.llenarFormulario(usuario);
      },
      error: () => {
        const usuarioLocal = this.authService.obtenerUsuarioActual();
        if (usuarioLocal) {
          this.usuario = usuarioLocal;
          this.llenarFormulario(usuarioLocal);
        }
      }
    });
  }

  llenarFormulario(usuario: Usuario) {
    if (usuario.redes_sociales) {
      this.formRedes.patchValue({
        linkedin: usuario.redes_sociales.linkedin || '',
        github: usuario.redes_sociales.github || '',
        twitter: usuario.redes_sociales.twitter || '',
        youtube: (usuario.redes_sociales as any).youtube || '',
        reddit: (usuario.redes_sociales as any).reddit || '',
        instagram: (usuario.redes_sociales as any).instagram || ''
      });
    }
  }

  async guardarRedesSociales() {
    this.guardandoRedes = true;
    const redes = this.formRedes.value;

    // Filtrar solo las redes con URL
    const redesFiltradas: any = {};
    Object.keys(redes).forEach(key => {
      if (redes[key] && redes[key].trim() !== '') {
        redesFiltradas[key] = redes[key];
      }
    });

    try {
      await this.authService.actualizarPerfil({
        redes_sociales: redesFiltradas
      }).toPromise();

      this.notificacionesService.mostrar('exito', 'Redes sociales actualizadas correctamente');
      this.cargarUsuario();
    } catch (error: any) {
      const mensaje = error.error?.mensaje || 'Error al actualizar redes sociales';
      this.notificacionesService.mostrar('error', mensaje);
    } finally {
      this.guardandoRedes = false;
    }
  }

  cancelarCambios() {
    if (this.usuario) {
      this.llenarFormulario(this.usuario);
    }
    this.formRedes.markAsPristine();
    this.formRedes.markAsUntouched();
  }

  urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(control.value) ? null : { urlInvalida: true };
  }
}