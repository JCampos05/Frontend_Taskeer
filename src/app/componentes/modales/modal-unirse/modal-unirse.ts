import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompartirService } from '../../../core/services/compartir/compartir';
import { NotificacionesService } from '../../../core/services/notification/notification';

@Component({
  selector: 'app-modal-unirse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-unirse.html',
  styleUrls: ['./modal-unirse.css']
})
export class ModalUnirseComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() unido = new EventEmitter<void>();

  claveIngresada = '';
  isLoading = false;

  constructor(
    private compartirService: CompartirService,
    private notificacionesService: NotificacionesService
  ) {}

  cerrarModal() {
    this.claveIngresada = '';
    this.isLoading = false;
    this.close.emit();
  }

  async unirseALista() {
    if (!this.claveIngresada.trim()) {
      this.notificacionesService.error('Por favor ingresa una clave');
      return;
    }

    const clave = this.claveIngresada.trim().toUpperCase();

    if (clave.length !== 8) {
      this.notificacionesService.error('La clave debe tener exactamente 8 caracteres');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.compartirService.unirseListaPorClave(clave).toPromise();
      
      console.log('Respuesta exitosa:', response);
      this.notificacionesService.exito('Te has unido a la lista exitosamente');
      this.unido.emit();
      this.cerrarModal();
    } catch (error: any) {
      console.error('Error completo al unirse:', error);
      
      if (error.status === 404) {
        this.notificacionesService.error('Clave invalida o lista no encontrada');
      } else if (error.status === 400) {
        const mensaje = error.error?.error || 'Ya tienes acceso a esta lista';
        this.notificacionesService.error(mensaje);
      } else if (error.status === 409) {
        this.notificacionesService.error('Ya eres miembro de esta lista');
      } else {
        this.notificacionesService.error('Error al unirse a la lista');
      }
    } finally {
      this.isLoading = false;
    }
  }
}