import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TareasService, Tarea, UsuarioDisponible } from '../../../core/services/tareas/tareas';
import { NotificacionesService } from '../../../core/services/notification/notification';

@Component({
  selector: 'app-modal-asignar-tarea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-asignar-tarea.html',
  styleUrls: ['./modal-asignar-tarea.css']
})
export class ModalAsignarTareaComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() tarea: Tarea | null = null;
  @Input() idLista: number = 0;

  @Output() close = new EventEmitter<void>();
  @Output() asignado = new EventEmitter<void>();

  //Listas separadas
  usuarios: UsuarioDisponible[] = [];
  tareas: Tarea[] = [];

  usuarioSeleccionado: number | null = null;
  tareaSeleccionada: Tarea | null = null;

  cargando = false;
  procesando = false;

  constructor(
    private tareasService: TareasService,
    private notificacionesService: NotificacionesService 
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      console.log('Modal abierto, idLista:', this.idLista, 'tarea:', this.tarea);

      // Determinar idLista
      let listaParaCargar = this.idLista;
      if (!listaParaCargar && this.tarea?.idLista) {
        listaParaCargar = this.tarea.idLista;
      }

      if (listaParaCargar && listaParaCargar > 0) {
        this.idLista = listaParaCargar;
        this.cargarDatos();
      } else {
        console.warn('No hay idLista válido');
        this.usuarios = [];
        this.tareas = [];
      }

      // Si se abrió con una tarea específica, preseleccionarla
      if (this.tarea) {
        this.tareaSeleccionada = this.tarea;
        if (this.tarea.idUsuarioAsignado) {
          this.usuarioSeleccionado = this.tarea.idUsuarioAsignado;
        }
      } else {
        this.tareaSeleccionada = null;
        this.usuarioSeleccionado = null;
      }
    }
  }

  async cargarDatos() {
    this.cargando = true;
    console.log('Cargando usuarios y tareas para lista:', this.idLista);

    try {
      // Cargar usuarios y tareas en paralelo
      const [usuarios, tareas] = await Promise.all([
        this.tareasService.obtenerUsuariosDisponibles(this.idLista),
        this.tareasService.obtenerTodasTareasLista(this.idLista)
      ]);

      this.usuarios = usuarios;
      this.tareas = tareas;

      console.log('Usuarios cargados:', this.usuarios.length);
      console.log('Tareas cargadas:', this.tareas.length);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      //alert('Error al cargar la información');
      this.notificacionesService.error('Error al cargar la información');
    } finally {
      this.cargando = false;
    }
  }

  seleccionarUsuario(usuario: UsuarioDisponible) {
    this.usuarioSeleccionado = usuario.idUsuario;
    console.log('Usuario seleccionado:', usuario.nombre);
  }

  seleccionarTarea(tarea: Tarea) {
    this.tareaSeleccionada = tarea;
    console.log('Tarea seleccionada:', tarea.nombre);
  }

  async asignar() {
    if (!this.usuarioSeleccionado || !this.tareaSeleccionada?.idTarea) {
      //alert('Debes seleccionar un usuario y una tarea');
      this.notificacionesService.info('Debes seleccionar un usuario y una tarea');
      return;
    }

    this.procesando = true;
    try {
      await this.tareasService.asignarTarea(
        this.tareaSeleccionada.idTarea,
        this.usuarioSeleccionado
      );

      console.log('Tarea asignada exitosamente');
      this.notificacionesService.exito('Tarea asignada exitosamente');
      this.asignado.emit();
      this.cerrar();
    } catch (error: any) {
      console.error('Error al asignar tarea:', error);
      const mensaje = error.error?.message || 'Error al asignar la tarea';
      this.notificacionesService.error(mensaje);
      //alert(mensaje);
    } finally {
      this.procesando = false;
    }
  }

  async desasignar() {
    if (!this.tareaSeleccionada?.idTarea) {
      return;
    }

    if (!confirm('¿Deseas desasignar esta tarea?')) {
      return;
    }

    this.procesando = true;
    try {
      await this.tareasService.desasignarTarea(this.tareaSeleccionada.idTarea);
      console.log('Tarea desasignada exitosamente');
      this.asignado.emit();
      this.cerrar();
    } catch (error: any) {
      console.error('Error al desasignar tarea:', error);
      const mensaje = error.error?.message || 'Error al desasignar la tarea';
      this.notificacionesService.error(mensaje);
      //alert(mensaje);
    } finally {
      this.procesando = false;
    }
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }

  cerrar() {
    this.usuarioSeleccionado = null;
    this.tareaSeleccionada = null;
    this.close.emit();
  }

  obtenerUsuarioSeleccionado(): UsuarioDisponible | undefined {
    return this.usuarios.find(u => u.idUsuario === this.usuarioSeleccionado);
  }
  hayUsuariosDisponibles(): boolean {
    return this.usuarios.length > 1;
  }
}