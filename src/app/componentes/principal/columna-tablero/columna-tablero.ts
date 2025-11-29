import { Component, Input, Output, EventEmitter, OnInit, OnChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lista } from '../../../core/services/listas/listas';
import { Tarea, TareasService } from '../../../core/services/tareas/tareas';

@Component({
  selector: 'app-columna-tablero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './columna-tablero.html',
  styleUrl: './columna-tablero.css'
})
export class ColumnaTableroComponent implements OnInit, OnChanges {
  @Input() lista!: Lista;
  @Input() tareas: Tarea[] = [];
  @Input() cargando = false;
  @Output() tareasActualizadas = new EventEmitter<void>();
  @Output() compartir = new EventEmitter<void>();
  @Output() editar = new EventEmitter<void>();
  @Output() eliminar = new EventEmitter<void>();
  @Output() tareaClick = new EventEmitter<number>();

  // Tareas agrupadas: pendientes/proceso vs completadas
  tareasPendientes: Tarea[] = [];
  tareasCompletadasList: Tarea[] = [];

  // Control del menú
  menuAbierto = false;

  constructor(
    private tareasService: TareasService
  ) { }

  // Cerrar menú al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.header-actions')) {
      this.menuAbierto = false;
    }
  }

  ngOnInit() {
    this.distribuirTareas();
    console.log('🔍 TEST Lista:', this.lista.nombre);
    console.log('⭐ Valor importante:', this.lista.importante);
    console.log('✅ Es importante?:', this.esListaImportante());
  }

  ngOnChanges() {
    this.distribuirTareas();
  }

  distribuirTareas() {
    // Reiniciar arrays
    this.tareasPendientes = [];
    this.tareasCompletadasList = [];

    // Separar tareas completadas de las pendientes/en proceso
    this.tareas.forEach(tarea => {
      if (tarea.estado === 'C') {
        this.tareasCompletadasList.push(tarea);
      } else {
        // Pendientes (P) o en proceso (N)
        this.tareasPendientes.push(tarea);
      }
    });

    // Ordenar: importantes primero
    this.tareasPendientes.sort((a, b) => {
      if (a.importante === b.importante) return 0;
      return a.importante ? -1 : 1;
    });

    this.tareasCompletadasList.sort((a, b) => {
      if (a.importante === b.importante) return 0;
      return a.importante ? -1 : 1;
    });
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  onCompartir() {
    this.menuAbierto = false;
    this.compartir.emit();
  }

  onEditar() {
    this.menuAbierto = false;
    this.editar.emit();
  }

  onEliminar() {
    this.menuAbierto = false;
    this.eliminar.emit();
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    if (icono.trim().startsWith('fa')) return false;
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

  obtenerGradiente(color: string): string {
    return `linear-gradient(135deg, ${color} 0%, ${this.ajustarColor(color, -20)} 100%)`;
  }

  ajustarColor(color: string, porcentaje: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + porcentaje));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + porcentaje));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + porcentaje));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  abrirDetalleTarea(tarea: Tarea) {
    console.log('🔵 Click en tarea:', tarea.idTarea, tarea.nombre);
  }

  trackByTareaId(index: number, tarea: Tarea): number {
    return tarea.idTarea || index;
  }

  get totalTareas(): number {
    return this.tareas.length;
  }

  get tareasCompletadas(): number {
    return this.tareasCompletadasList.length;
  }

  esListaImportante(): boolean {
    return Boolean(this.lista.importante);
  }
}