import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-eliminar-tarea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-eliminar-tarea.html',
  styleUrl: './modal-eliminar-tarea.css'
})
export class ModalEliminarTareaComponent {
  @Input() nombreTarea: string = '';
  @Input() tipoEliminacion: 'tarea' | 'lista' = 'tarea';
  @Input() mostrar: boolean = false;
  
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar() {
    this.confirmar.emit();
  }

  onCancelar() {
    this.cancelar.emit();
  }

  // Cerrar modal al hacer clic fuera de él
  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancelar();
    }
  }
}