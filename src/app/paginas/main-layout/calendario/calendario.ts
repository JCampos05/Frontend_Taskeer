import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { NotificacionesService } from '../../../core/services/notification/notification';
import { PanelDetallesComponent } from '../../../componentes/principal/panel-detalles/panel-detalles';

interface DiaCalendario {
  fecha: Date;
  dia: number;
  esDelMes: boolean;
  tareas: Tarea[];
}

interface TareaExtendida extends Tarea {
  diasDuracion?: number;
  esInicio?: boolean;
  esFin?: boolean;
  continuaAnterior?: boolean;
  continuaSiguiente?: boolean;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, PanelDetallesComponent],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class CalendarioComponent implements OnInit {
  mesActual: Date = new Date();
  diasCalendario: DiaCalendario[] = [];
  tareas: Tarea[] = [];

  // Panel de detalles
  panelAbierto = false;
  idTareaSeleccionada: number | null = null;

  // Modal día
  modalDiaAbierto = false;
  diaSeleccionado: Date | null = null;
  tareasDelDia: Tarea[] = [];

  // Selector de fecha
  selectorFechaAbierto = false;

  // Drag and drop
  tareaArrastrada: Tarea | null = null;

  constructor(
    private tareasService: TareasService,
    private notificacionesService: NotificacionesService
  ) { }

  async ngOnInit() {
    await this.cargarTareas();
    this.generarCalendario();
  }

  async cargarTareas() {
    try {
      this.tareas = await this.tareasService.obtenerTareas();
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      this.notificacionesService.error('Error al cargar las tareas');
    }
  }

  generarCalendario() {
    this.diasCalendario = [];
    const año = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();

    // Primer día del mes
    const primerDia = new Date(año, mes, 1);
    const diaSemana = primerDia.getDay();

    // Último día del mes
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();

    // Días del mes anterior para completar la primera semana
    const diasMesAnterior = diaSemana === 0 ? 6 : diaSemana - 1;
    const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();

    for (let i = diasMesAnterior; i > 0; i--) {
      const fecha = new Date(año, mes - 1, ultimoDiaMesAnterior - i + 1);
      this.diasCalendario.push({
        fecha,
        dia: ultimoDiaMesAnterior - i + 1,
        esDelMes: false,
        tareas: this.obtenerTareasDia(fecha)
      });
    }

    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia);
      this.diasCalendario.push({
        fecha,
        dia,
        esDelMes: true,
        tareas: this.obtenerTareasDia(fecha)
      });
    }

    // Días del mes siguiente para completar la última semana
    const diasRestantes = 42 - this.diasCalendario.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(año, mes + 1, dia);
      this.diasCalendario.push({
        fecha,
        dia,
        esDelMes: false,
        tareas: this.obtenerTareasDia(fecha)
      });
    }
  }

  obtenerTareasDia(fecha: Date): Tarea[] {
    const fechaStr = this.formatearFecha(fecha);

    return this.tareas.filter(tarea => {
      if (!tarea.fechaVencimiento) {
        // Tareas sin fecha de vencimiento solo se muestran el día de creación
        if (tarea.fechaCreacion) {
          const fechaCreacion = this.formatearFecha(new Date(tarea.fechaCreacion));
          return fechaCreacion === fechaStr;
        }
        return false;
      }

      // Solo mostrar en el día de vencimiento
      const fechaVencimiento = this.formatearFecha(new Date(tarea.fechaVencimiento));
      return fechaVencimiento === fechaStr;
    });
  }

  formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  mesAnterior() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1);
    this.generarCalendario();
  }

  mesSiguiente() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1);
    this.generarCalendario();
  }

  irAHoy() {
    this.mesActual = new Date();
    this.generarCalendario();
    this.selectorFechaAbierto = false;
  }

  seleccionarMes(mes: number, año: number) {
    this.mesActual = new Date(año, mes);
    this.generarCalendario();
    this.selectorFechaAbierto = false;
  }

  toggleSelectorFecha() {
    this.selectorFechaAbierto = !this.selectorFechaAbierto;
  }

  obtenerNombreMes(): string {
    const mes = this.mesActual.toLocaleDateString('es-MX', { month: 'long' });
    const anio = this.mesActual.getFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`;
  }

  obtenerMesesDelAnio(): { mes: number, nombre: string }[] {
    const meses = [];
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(this.mesActual.getFullYear(), i, 1);
      const nombre = fecha.toLocaleDateString('es-MX', { month: 'long' });
      meses.push({
        mes: i,
        nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1)
      });
    }
    return meses;
  }

  obtenerAnioActual(): number {
    return this.mesActual.getFullYear();
  }

  cambiarDeAnio(direccion: number) {
    this.mesActual = new Date(this.mesActual.getFullYear() + direccion, this.mesActual.getMonth(), 1);
    this.generarCalendario();
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear();
  }

  abrirPanelNuevaTarea() {
    this.idTareaSeleccionada = null;
    this.panelAbierto = true;
  }

  abrirTarea(tarea: Tarea, event: Event) {
    event.stopPropagation();
    this.idTareaSeleccionada = tarea.idTarea || null;
    this.panelAbierto = true;
    // NO cerramos el modal si está abierto
  }

  cerrarPanel() {
    this.panelAbierto = false;
    this.idTareaSeleccionada = null;
  }

  async onTareaGuardada() {
    await this.cargarTareas();
    this.generarCalendario();
    if (this.modalDiaAbierto && this.diaSeleccionado) {
      this.tareasDelDia = this.obtenerTareasDia(this.diaSeleccionado);
    }
  }

  abrirModalDia(dia: DiaCalendario) {
    this.diaSeleccionado = dia.fecha;
    this.tareasDelDia = dia.tareas;
    this.modalDiaAbierto = true;
  }

  cerrarModalDia() {
    this.modalDiaAbierto = false;
    this.diaSeleccionado = null;
    this.tareasDelDia = [];
  }

  abrirNuevaTareaDesdeModal() {
    this.idTareaSeleccionada = null;
    this.panelAbierto = true;
    // NO cerramos el modal
  }

  obtenerNombreDia(fecha: Date): string {
    return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  async toggleTareaCompleta(tarea: Tarea) {
    if (!tarea.idTarea) return;

    const nuevoEstado = tarea.estado === 'C' ? 'P' : 'C';

    try {
      await this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado).toPromise();
      tarea.estado = nuevoEstado;

      if (nuevoEstado === 'C') {
        this.notificacionesService.exito('Tarea completada');
      } else {
        this.notificacionesService.info('Tarea marcada como pendiente');
      }

      await this.cargarTareas();
      this.generarCalendario();

      if (this.modalDiaAbierto && this.diaSeleccionado) {
        this.tareasDelDia = this.obtenerTareasDia(this.diaSeleccionado);
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      this.notificacionesService.error('Error al actualizar la tarea');
    }
  }

  // Drag and Drop
  onDragStart(event: DragEvent, tarea: Tarea) {
    this.tareaArrastrada = tarea;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  async onDrop(event: DragEvent, dia: DiaCalendario) {
    event.preventDefault();

    if (!this.tareaArrastrada || !this.tareaArrastrada.idTarea) return;

    const nuevaFecha = this.formatearFecha(dia.fecha);

    try {
      await this.tareasService.actualizarFechaVencimiento(
        this.tareaArrastrada.idTarea,
        nuevaFecha
      );

      this.notificacionesService.exito('Tarea movida exitosamente');
      await this.cargarTareas();
      this.generarCalendario();

      if (this.modalDiaAbierto && this.diaSeleccionado) {
        this.tareasDelDia = this.obtenerTareasDia(this.diaSeleccionado);
      }
    } catch (error) {
      console.error('Error al mover tarea:', error);
      this.notificacionesService.error('Error al mover la tarea');
    }

    this.tareaArrastrada = null;
  }

  onDragEnd() {
    this.tareaArrastrada = null;
  }

  obtenerClasePrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'A': return 'prioridad-alta';
      case 'B': return 'prioridad-baja';
      default: return 'prioridad-normal';
    }
  }

  calcularDuracionTarea(tarea: Tarea): number {
    if (!tarea.fechaVencimiento) return 1;

    const fechaCreacion = tarea.fechaCreacion ? new Date(tarea.fechaCreacion) : new Date();
    const fechaVencimiento = new Date(tarea.fechaVencimiento);

    const inicio = new Date(fechaCreacion);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaVencimiento);
    fin.setHours(0, 0, 0, 0);

    const diferencia = fin.getTime() - inicio.getTime();
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(1, dias);
  }

  esInicioTarea(tarea: Tarea, fecha: Date): boolean {
    const fechaCreacion = tarea.fechaCreacion ? new Date(tarea.fechaCreacion) : new Date();
    const inicio = new Date(fechaCreacion);
    inicio.setHours(0, 0, 0, 0);

    const fechaActual = new Date(fecha);
    fechaActual.setHours(0, 0, 0, 0);

    return fechaActual.getTime() === inicio.getTime();
  }

  esFinTarea(tarea: Tarea, fecha: Date): boolean {
    if (!tarea.fechaVencimiento) return true;

    const fin = new Date(tarea.fechaVencimiento);
    fin.setHours(0, 0, 0, 0);

    const fechaActual = new Date(fecha);
    fechaActual.setHours(0, 0, 0, 0);

    return fechaActual.getTime() === fin.getTime();
  }

  obtenerIconoLista(tarea: Tarea): string {
    if (tarea.iconoLista && tarea.iconoLista !== 'null' && tarea.iconoLista !== '') {
      // Si es un icono de Font Awesome, devolverlo
      if (tarea.iconoLista.includes('fa-')) {
        return tarea.iconoLista;
      }
    }
    return 'fa-list'; // Icono por defecto
  }

  esIconoFontAwesome(icono: string | undefined): boolean {
    return icono ? icono.includes('fa-') : false;
  }

  trackByDia(index: number, dia: DiaCalendario): string {
    return dia.fecha.toISOString();
  }

  trackByTarea(index: number, tarea: Tarea): number {
    return tarea.idTarea || index;
  }
}