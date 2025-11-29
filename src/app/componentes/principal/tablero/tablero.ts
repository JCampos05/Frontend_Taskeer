import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { ListasService } from '../../../core/services/listas/listas';
import { TareaCardComponent } from '../tarea-card/tarea-card';
import { PanelDetallesComponent } from '../panel-detalles/panel-detalles';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../core/services/authentication/authentication';

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [CommonModule, TareaCardComponent, PanelDetallesComponent, CdkDrag, CdkDropList],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css'
})
export class TableroComponent implements OnInit {
  @Input() tipoVista: 'pendientes' | 'progreso' | 'completadas' | 'vencidas' | 'mi-dia' = 'pendientes';

  tareasColumna: Tarea[] = [];

  panelAbierto = false;
  tareaSeleccionada: number | null = null;

  // Nueva propiedad para controlar el modo de vista
  modoVista: 'card' | 'lista' = 'card';

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.cargarTareas();
  }

  // En tablero.ts, método cargarTareas()

  async cargarTareas() {
    try {
      let tareas: Tarea[] = [];

      if (this.tipoVista === 'mi-dia') {
        // ✅ Obtener ID del usuario actual
        const usuarioActual = this.authService.obtenerUsuarioActual();
        const idUsuarioActual = usuarioActual?.idUsuario;

        // Cargar todas las tareas de Mi Día
        const todasLasTareas = await this.tareasService.obtenerTareasMiDia();

        // ✅ FILTRO: Solo mostrar tareas sin asignar O asignadas al usuario actual
        tareas = todasLasTareas.filter(tarea => {
          // Si no tiene usuario asignado, mostrarla
          if (!tarea.idUsuarioAsignado) {
            return true;
          }

          // Si tiene usuario asignado, solo mostrarla si es el usuario actual
          return tarea.idUsuarioAsignado === idUsuarioActual;
        });

        console.log('🌞 Tareas Mi Día filtradas:', {
          total: todasLasTareas.length,
          filtradas: tareas.length,
          usuarioActual: idUsuarioActual
        });

      } else if (this.tipoVista === 'vencidas') {
        tareas = await this.tareasService.obtenerTareasVencidas();
      } else {
        const estadoMap = {
          'pendientes': 'P',
          'progreso': 'N',
          'completadas': 'C'
        };
        tareas = await this.tareasService.obtenerTareasPorEstado(estadoMap[this.tipoVista]);
      }

      this.tareasColumna = tareas;
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  get tituloColumna(): string {
    const titulos = {
      'mi-dia': 'Mi Día',
      'pendientes': 'Tareas Pendientes',
      'progreso': 'En Proceso',
      'completadas': 'Completadas',
      'vencidas': 'Vencidas'
    };
    return titulos[this.tipoVista];
  }

  // Método para alternar entre vistas
  alternarModoVista() {
    this.modoVista = this.modoVista === 'card' ? 'lista' : 'card';
  }

  abrirPanelDetalles(idTarea: number | null = null) {
    this.tareaSeleccionada = idTarea;
    this.panelAbierto = true;
  }

  cerrarPanelDetalles() {
    this.panelAbierto = false;
    this.tareaSeleccionada = null;
  }

  async onTareaGuardada() {
    await this.cargarTareas();
    this.cerrarPanelDetalles();
  }

  async onEstadoCambiado() {
    await this.cargarTareas();
  }

  async onDrop(event: CdkDragDrop<Tarea[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  async onTareaEliminada() {
    await this.cargarTareas();
  }
}