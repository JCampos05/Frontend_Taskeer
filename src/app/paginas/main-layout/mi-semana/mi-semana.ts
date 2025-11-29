import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { ListasService } from '../../../core/services/listas/listas';
import { PanelDetallesComponent } from '../../../componentes/principal/panel-detalles/panel-detalles';
import { NotificacionesService } from '../../../core/services/notification/notification';

interface TareaConLista extends Tarea {
  nombreLista?: string;
  iconoLista?: string;
  colorLista?: string;
}

interface DiaInfo {
  fecha: Date;
  diaNombre: string;
  diaNumero: number;
  mes: string;
  esHoy: boolean;
  tareas: TareaConLista[];
}

interface DiaCalendario {
  numero: number;
  fecha: Date;
  delMesActual: boolean;
  esHoy: boolean;
  seleccionado: boolean;
}

@Component({
  selector: 'app-mi-semana',
  standalone: true,
  imports: [CommonModule, FormsModule, PanelDetallesComponent],
  templateUrl: './mi-semana.html',
  styleUrl: './mi-semana.css'
})
export class MiSemanaComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('panelDetalles') panelDetalles!: PanelDetallesComponent;

  dias: DiaInfo[] = [];
  semanaActual: Date = new Date();
  mostrarCalendario = false;
  panelDetallesAbierto = false;
  idTareaSeleccionada: number | null = null;
  puedeEditarTarea = true;

  // Panel día seleccionado
  diaSeleccionadoPanel: DiaInfo | null = null;
  panelDiaAbierto = false;

  // Drag and drop
  tareaDrag: TareaConLista | null = null;
  diaOrigenDrag: DiaInfo | null = null;

  // Calendario desplegable
  mesCalendario: string = '';
  anioCalendario: number = 0;
  diasCalendario: DiaCalendario[] = [];
  fechaCalendarioActual: Date = new Date();

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit() {
    this.generarSemana(this.semanaActual);
    this.cargarTareas();
  }

  generarSemana(fecha: Date) {
    this.dias = [];
    const inicioSemana = this.obtenerInicioSemana(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const diaFecha = new Date(inicioSemana);
      diaFecha.setDate(inicioSemana.getDate() + i);
      
      const esHoy = diaFecha.getTime() === hoy.getTime();

      this.dias.push({
        fecha: diaFecha,
        diaNombre: this.obtenerNombreDia(diaFecha.getDay()),
        diaNumero: diaFecha.getDate(),
        mes: this.obtenerNombreMes(diaFecha.getMonth()),
        esHoy,
        tareas: []
      });
    }
  }

  obtenerInicioSemana(fecha: Date): Date {
    const dia = new Date(fecha);
    const diaSemana = dia.getDay();
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    dia.setDate(dia.getDate() + diff);
    dia.setHours(0, 0, 0, 0);
    return dia;
  }

  obtenerNombreDia(dia: number): string {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[dia];
  }

  obtenerNombreMes(mes: number): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[mes];
  }

  obtenerNombreMesCompleto(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
  }

  async cargarTareas() {
    try {
      const todasTareas = await this.tareasService.obtenerTareas();
      const listas = await this.listasService.obtenerListas();

      // Limpiar tareas de todos los días
      this.dias.forEach(dia => dia.tareas = []);

      todasTareas.forEach(tarea => {
        const lista = listas.find(l => l.idLista === tarea.idLista);
        const tareaConLista: TareaConLista = {
          ...tarea,
          nombreLista: lista?.nombre,
          iconoLista: lista?.icono,
          colorLista: lista?.color
        };

        // Asignar tarea a día según fecha de vencimiento o creación
        let fechaAsignacion: Date;
        
        if (tarea.fechaVencimiento) {
          fechaAsignacion = new Date(tarea.fechaVencimiento);
        } else if (tarea.fechaCreacion) {
          fechaAsignacion = new Date(tarea.fechaCreacion);
        } else {
          return; // No asignar si no hay fecha
        }

        fechaAsignacion.setHours(0, 0, 0, 0);

        // Buscar el día correspondiente
        const dia = this.dias.find(d => {
          const diaFecha = new Date(d.fecha);
          diaFecha.setHours(0, 0, 0, 0);
          return diaFecha.getTime() === fechaAsignacion.getTime();
        });

        if (dia) {
          dia.tareas.push(tareaConLista);
        }
      });
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  semanaAnterior() {
    const nuevaFecha = new Date(this.semanaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    this.semanaActual = nuevaFecha;
    this.generarSemana(this.semanaActual);
    this.cargarTareas();
  }

  semanaSiguiente() {
    const nuevaFecha = new Date(this.semanaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    this.semanaActual = nuevaFecha;
    this.generarSemana(this.semanaActual);
    this.cargarTareas();
  }

  irASemanaActual() {
    this.semanaActual = new Date();
    this.generarSemana(this.semanaActual);
    this.cargarTareas();
    
    // Centrar en el día de hoy después de cargar
    setTimeout(() => this.centrarEnDia(this.dias.findIndex(d => d.esHoy)), 100);
  }

  toggleCalendario() {
    this.mostrarCalendario = !this.mostrarCalendario;
    if (this.mostrarCalendario) {
      this.inicializarCalendario();
    }
  }

  // === CALENDARIO DESPLEGABLE ===
  inicializarCalendario() {
    this.fechaCalendarioActual = new Date(this.semanaActual);
    this.generarCalendario();
  }

  generarCalendario() {
    const fecha = new Date(this.fechaCalendarioActual);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth();
    
    this.anioCalendario = anio;
    this.mesCalendario = this.obtenerNombreMesCompleto(mes);
    
    // Primer dia del mes
    const primerDia = new Date(anio, mes, 1);
    const primerDiaSemana = primerDia.getDay();
    
    // Ultimo dia del mes
    const ultimoDia = new Date(anio, mes + 1, 0);
    const ultimoDiaDelMes = ultimoDia.getDate();
    
    // Dias del mes anterior
    const mesAnterior = new Date(anio, mes, 0);
    const diasMesAnterior = mesAnterior.getDate();
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    this.diasCalendario = [];
    
    // Dias del mes anterior
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      const fechaDia = new Date(anio, mes - 1, dia);
      fechaDia.setHours(0, 0, 0, 0);
      
      this.diasCalendario.push({
        numero: dia,
        fecha: fechaDia,
        delMesActual: false,
        esHoy: fechaDia.getTime() === hoy.getTime(),
        seleccionado: false
      });
    }
    
    // Dias del mes actual
    for (let dia = 1; dia <= ultimoDiaDelMes; dia++) {
      const fechaDia = new Date(anio, mes, dia);
      fechaDia.setHours(0, 0, 0, 0);
      
      this.diasCalendario.push({
        numero: dia,
        fecha: fechaDia,
        delMesActual: true,
        esHoy: fechaDia.getTime() === hoy.getTime(),
        seleccionado: false
      });
    }
    
    // Dias del mes siguiente para completar la grilla
    const diasRestantes = 42 - this.diasCalendario.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fechaDia = new Date(anio, mes + 1, dia);
      fechaDia.setHours(0, 0, 0, 0);
      
      this.diasCalendario.push({
        numero: dia,
        fecha: fechaDia,
        delMesActual: false,
        esHoy: fechaDia.getTime() === hoy.getTime(),
        seleccionado: false
      });
    }
  }

  mesAnterior() {
    this.fechaCalendarioActual.setMonth(this.fechaCalendarioActual.getMonth() - 1);
    this.generarCalendario();
  }

  mesSiguiente() {
    this.fechaCalendarioActual.setMonth(this.fechaCalendarioActual.getMonth() + 1);
    this.generarCalendario();
  }

  seleccionarDiaCalendario(dia: DiaCalendario) {
    this.semanaActual = new Date(dia.fecha);
    this.generarSemana(this.semanaActual);
    this.cargarTareas();
    this.mostrarCalendario = false;
  }

  irAHoyCalendario() {
    this.fechaCalendarioActual = new Date();
    this.semanaActual = new Date();
    this.generarCalendario();
    this.generarSemana(this.semanaActual);
    this.cargarTareas();
    this.mostrarCalendario = false;
    setTimeout(() => this.centrarEnDia(this.dias.findIndex(d => d.esHoy)), 100);
  }

  abrirPanelDetalles(idTarea?: number) {
    if (idTarea) {
      this.idTareaSeleccionada = idTarea;
    } else {
      this.idTareaSeleccionada = null;
    }
    this.panelDetallesAbierto = true;
  }

  cerrarPanelDetalles() {
    this.panelDetallesAbierto = false;
    this.idTareaSeleccionada = null;
  }

  async onTareaGuardada() {
    await this.cargarTareas();
  }

  // Panel día seleccionado
  seleccionarDia(dia: DiaInfo, index: number) {
    this.diaSeleccionadoPanel = dia;
    this.panelDiaAbierto = true;
    this.centrarEnDia(index);
  }

  cerrarPanelDia() {
    this.panelDiaAbierto = false;
    this.diaSeleccionadoPanel = null;
  }

  centrarEnDia(index: number) {
    if (!this.scrollContainer) return;

    const container = this.scrollContainer.nativeElement;
    const columnas = container.querySelectorAll('.dia-columna');
    
    if (!columnas[index]) return;

    const columna = columnas[index] as HTMLElement;
    const containerWidth = container.offsetWidth;
    const columnaWidth = columna.offsetWidth;
    const columnaLeft = columna.offsetLeft;

    // Calcular posición para centrar
    const scrollPosition = columnaLeft - (containerWidth / 2) + (columnaWidth / 2);
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  }

  // Drag and Drop
  onDragStart(event: DragEvent, tarea: TareaConLista, dia: DiaInfo) {
    this.tareaDrag = tarea;
    this.diaOrigenDrag = dia;
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }

    // Añadir clase visual
    (event.target as HTMLElement).classList.add('dragging');
    
    // Iniciar auto-scroll
    this.iniciarAutoScroll(event);
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    this.detenerAutoScroll();
  }

  // Variables para auto-scroll
  private autoScrollInterval: any = null;
  private autoScrollSpeed = 0;

  private iniciarAutoScroll(event: DragEvent) {
    this.autoScrollInterval = setInterval(() => {
      if (this.autoScrollSpeed !== 0 && this.scrollContainer) {
        const container = this.scrollContainer.nativeElement;
        container.scrollLeft += this.autoScrollSpeed;
      }
    }, 16);
  }

  private detenerAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    this.autoScrollSpeed = 0;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    // Calcular auto-scroll horizontal
    if (this.scrollContainer) {
      const container = this.scrollContainer.nativeElement;
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX;
      const threshold = 100;

      if (mouseX < rect.left + threshold) {
        this.autoScrollSpeed = -10;
      } else if (mouseX > rect.right - threshold) {
        this.autoScrollSpeed = 10;
      } else {
        this.autoScrollSpeed = 0;
      }
    }
  }

  onDragEnter(event: DragEvent, dia: DiaInfo) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }

  async onDrop(event: DragEvent, diaDestino: DiaInfo) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');

    if (!this.tareaDrag || !this.diaOrigenDrag) return;

    // No hacer nada si es el mismo día
    if (this.diaOrigenDrag.fecha.getTime() === diaDestino.fecha.getTime()) {
      this.tareaDrag = null;
      this.diaOrigenDrag = null;
      return;
    }

    try {
      // Actualizar fecha de vencimiento
      const nuevaFecha = new Date(diaDestino.fecha);
      const fechaStr = nuevaFecha.toISOString().split('T')[0];

      await this.tareasService.actualizarFechaVencimiento(
        this.tareaDrag.idTarea!,
        fechaStr
      );

      // Mover tarea visualmente
      const indexOrigen = this.diaOrigenDrag.tareas.findIndex(
        t => t.idTarea === this.tareaDrag!.idTarea
      );
      
      if (indexOrigen > -1) {
        this.diaOrigenDrag.tareas.splice(indexOrigen, 1);
        diaDestino.tareas.push(this.tareaDrag);
      }

      this.notificacionesService.exito('Tarea movida exitosamente');
    } catch (error) {
      console.error('Error al mover tarea:', error);
      this.notificacionesService.error('Error al mover la tarea');
    }

    this.tareaDrag = null;
    this.diaOrigenDrag = null;
  }

  trackByTarea(index: number, tarea: TareaConLista): number {
    return tarea.idTarea || index;
  }

  trackByDia(index: number, dia: DiaInfo): number {
    return dia.fecha.getTime();
  }

  obtenerIconoLista(tarea: TareaConLista): string {
    if (!tarea.iconoLista || tarea.iconoLista === 'null') return '';
    if (tarea.iconoLista.startsWith('fa')) return ''; //📋
    return tarea.iconoLista;
  }

  crearTareaEnDia(dia: DiaInfo) {
    // Configurar fecha predeterminada
    const fechaStr = dia.fecha.toISOString().split('T')[0];
    
    // Abrir panel con fecha predeterminada
    this.idTareaSeleccionada = null;
    this.panelDetallesAbierto = true;
  }
}