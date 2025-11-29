import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Nota {
  idNota?: number;
  titulo: string;
  contenido: string;
  color: string;
  fijada: boolean;
  posicion: number;
  idUsuario?: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

@Component({
  selector: 'app-nota-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notas.html',
  styleUrls: ['./notas.css']
})
export class NotaCardComponent {
  @Input() nota!: Nota;
  @Output() editar = new EventEmitter<Nota>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() duplicar = new EventEmitter<number>();
  @Output() toggleFijar = new EventEmitter<Nota>();

  menuAbierto = false;

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  onEditar(event: Event): void {
    event.stopPropagation();
    this.editar.emit(this.nota);
    this.cerrarMenu();
  }

  onEliminar(event: Event): void {
    event.stopPropagation();
    this.eliminar.emit(this.nota.idNota!);
    this.cerrarMenu();
  }

  onDuplicar(event: Event): void {
    event.stopPropagation();
    this.duplicar.emit(this.nota.idNota!);
    this.cerrarMenu();
  }

  onToggleFijar(event: Event): void {
    event.stopPropagation();
    this.toggleFijar.emit(this.nota);
  }
}