import { Component, Input, Output, EventEmitter, SimpleChange, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { NotificacionesService } from '../../../core/services/notification/notification';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ModalEliminarTareaComponent } from '../../modales/modal-eliminar-tarea/modal-eliminar-tarea';

@Component({
  selector: 'app-tarea-card',
  standalone: true,
  imports: [CommonModule, CdkDragHandle, ModalEliminarTareaComponent],
  templateUrl: './tarea-card.html',
  styleUrl: './tarea-card.css'
})
export class TareaCardComponent implements OnChanges {
  @Input() tarea!: Tarea;
  @Input() puedeEditar: boolean = true;
  @Input() puedeEliminar: boolean = true;
  @Input() puedeAsignar: boolean = false;
  @Input() modoVista: 'card' | 'lista' = 'card';

  @Output() tareaClick = new EventEmitter<void>();
  @Output() estadoCambiado = new EventEmitter<void>();
  @Output() tareaEliminada = new EventEmitter<void>();
  @Output() asignarClick = new EventEmitter<void>();

  mostrarModalEliminar = false;
  tareaAEliminar: any = null;
  isClosingModal = false;

  constructor(
    private tareasService: TareasService,
    private notificacionesService: NotificacionesService
  ) { }

  ngOnChanges(changes: any) {
    if (changes['tarea'] && changes['tarea'].currentValue) {
      console.log('🔄 Tarea actualizada en tarea-card:', {
        id: this.tarea.idTarea,
        nombre: this.tarea.nombre,
        miDia: this.tarea.miDia,
        anterior: changes['tarea'].previousValue?.miDia,
        nuevo: changes['tarea'].currentValue?.miDia
      });
    }
  }

  onTareaClick() {
    this.tareaClick.emit();
  }

  onCheckboxChange(event: Event) {
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const nuevoEstado = checkbox.checked ? 'C' : 'P';

    const estadoAnterior = this.tarea.estado;
    this.tarea.estado = nuevoEstado;

    this.tareasService.cambiarEstado(this.tarea.idTarea!, nuevoEstado).subscribe({
      next: () => {
        this.estadoCambiado.emit();
        console.log('Estado cambiado exitosamente:', nuevoEstado);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.tarea.estado = estadoAnterior;
        checkbox.checked = estadoAnterior === 'C';
        this.notificacionesService.error('Error al actualizar el estado de la tarea');
      }
    });
  }

  async cambiarEstado(event: Event, nuevoEstado: 'P' | 'N' | 'C') {
    event.stopPropagation();

    this.tareasService.cambiarEstado(this.tarea.idTarea!, nuevoEstado).subscribe({
      next: () => {
        this.tarea.estado = nuevoEstado;
        this.estadoCambiado.emit();
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.notificacionesService.error('Error al actualizar el estado de la tarea');
      }
    });
  }

  async eliminarTarea(event: Event) {
    event.stopPropagation();

    this.tareaAEliminar = this.tarea;
    this.mostrarModalEliminar = true;
  }

  async confirmarEliminacion() {
    try {
      await this.tareasService.eliminarTarea(this.tareaAEliminar.idTarea!);
      this.notificacionesService.exito('Tarea eliminada exitosamente');
      this.tareaEliminada.emit();

      this.mostrarModalEliminar = false;
      this.tareaAEliminar = null;
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      this.notificacionesService.error('Error al eliminar la tarea. Por favor, intenta nuevamente.');

      this.mostrarModalEliminar = false;
      this.tareaAEliminar = null;
    }
  }

  cancelarEliminacion() {
    this.isClosingModal = true;
    setTimeout(() => {
      this.mostrarModalEliminar = false;
      this.tareaAEliminar = null;
      this.isClosingModal = false;
    }, 200);
  }

  abrirModalAsignar(event: Event) {
    event.stopPropagation();
    console.log('tarea-card: Emitiendo evento asignarClick para tarea:', this.tarea.idTarea, this.tarea.nombre);
    this.asignarClick.emit();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;

    if (icono.trim().startsWith('fa')) {
      return false;
    }

    return true;
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-clipboard-list';
    }

    const iconoLimpio = icono.trim();

    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    return 'fas fa-clipboard-list';
  }

  async alternarMiDia(event: Event) {
    event.stopPropagation();

    const estadoAnterior = this.tarea.miDia;

    console.log('🌞 alternarMiDia - Estado ANTES:', {
      idTarea: this.tarea.idTarea,
      nombre: this.tarea.nombre,
      miDiaAnterior: estadoAnterior,
      tipo: typeof estadoAnterior
    });

    try {
      const nuevoValor = !estadoAnterior;

      // ✅ CREAR NUEVA REFERENCIA del objeto tarea
      this.tarea = { ...this.tarea, miDia: nuevoValor };

      const response = await this.tareasService.alternarMiDia(
        this.tarea.idTarea!,
        nuevoValor
      );

      console.log('✅ Respuesta del servidor:', response);

      if (response.success && response.data) {
        // ✅ Actualizar con nueva referencia y conversión explícita
        const miDiaActualizado = Boolean(response.data.miDia === 1 || response.data.miDia === true);

        this.tarea = {
          ...this.tarea,
          miDia: miDiaActualizado
        };

        console.log('✅ Tarea actualizada con miDia:', {
          idTarea: this.tarea.idTarea,
          nombre: this.tarea.nombre,
          miDia: this.tarea.miDia,
          tipo: typeof this.tarea.miDia,
          valorOriginal: response.data.miDia
        });
      }

      // ✅ Emitir evento para recargar
      this.estadoCambiado.emit();

      if (nuevoValor) {
        this.notificacionesService.exito('Tarea agregada a Mi Día');
      } else {
        this.notificacionesService.exito('Tarea eliminada de Mi Día');
      }

    } catch (error) {
      console.error('❌ Error al actualizar Mi Día:', error);

      // ✅ Revertir con nueva referencia
      this.tarea = { ...this.tarea, miDia: estadoAnterior };

      this.notificacionesService.error(
        'Error al actualizar Mi Día. Por favor, intenta nuevamente.'
      );
    }
  }

  onCardClick(event: Event) {
    // Verificar que el click no fue en un botón o checkbox
    const target = event.target as HTMLElement;

    if (
      target.closest('button') ||
      target.closest('input[type="checkbox"]') ||
      target.classList.contains('tarea-checkbox')
    ) {
      return; // No abrir el panel si se clickeó un botón o checkbox
    }

    console.log('🖱️ Click en card:', this.tarea.idTarea, this.tarea.nombre);
    this.tareaClick.emit();
  }

  estaVencida(): boolean {
    if (!this.tarea.fechaVencimiento || this.tarea.estado === 'C') {
      return false;
    }

    const fechaVencimiento = new Date(this.tarea.fechaVencimiento);
    const hoy = new Date();

    fechaVencimiento.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    return fechaVencimiento < hoy;
  }

  get mostrarBotonIniciar(): boolean {
    return this.tarea.estado === 'P';
  }

  get mostrarBotonesProceso(): boolean {
    return this.tarea.estado === 'N';
  }

  get mostrarBotonReabrir(): boolean {
    return this.tarea.estado === 'C';
  }
}