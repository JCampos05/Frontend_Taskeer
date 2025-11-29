import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListasService, Lista } from '../../../core/services/listas/listas';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ModalCompartirComponent } from '../../../componentes/modales/modal-compartir/modal-compartir';
import { CompartirService } from '../../../core/services/compartir/compartir';
import { NotificacionesService } from '../../../core/services/notification/notification';


@Component({
  selector: 'app-listas-individuales',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCompartirComponent],
  templateUrl: './listas-individuales.html',
  styleUrl: './listas-individuales.css'
})
export class ListasIndividualesComponent implements OnInit, OnDestroy {
  listas: Lista[] = [];
  isLoading = false;
  errorMessage = '';
  listaAEliminar: Lista | null = null;
  listaAEditar: Lista | null = null;
  modalCompartirAbierto = false;
  listaParaCompartir: any = null;


  // Colores predefinidos comunes
  /*coloresPredefinidos = [
    { hex: '#0052CC', nombre: 'Azul' },
    { hex: '#00875A', nombre: 'Verde' },
    { hex: '#FF5630', nombre: 'Rojo' },
    { hex: '#FF991F', nombre: 'Naranja' },
    { hex: '#6554C0', nombre: 'Púrpura' },
    { hex: '#00B8D9', nombre: 'Cyan' },
    { hex: '#36B37E', nombre: 'Verde claro' },
    { hex: '#403294', nombre: 'Morado' },
    { hex: '#FF8B00', nombre: 'Naranja oscuro' },
    { hex: '#172B4D', nombre: 'Azul oscuro' }
  ];*/
    coloresPredefinidos = [
    { hex: '#2B3252', nombre: 'Azul profundo' },
    { hex: '#19264D', nombre: 'Azul oscuro' },
    { hex: '#25458E', nombre: 'Azul grisáceo' },
    { hex: '#3D7ADE', nombre: 'Azul sistema' },
    { hex: '#6D7AA9', nombre: 'Gris azulado' },
    { hex: '#BAC0CE', nombre: 'Azul interfaz' },
    { hex: '#3B3B42', nombre: 'Gris roca' },
    { hex: '#2D2D38', nombre: 'Pizarra' },
    { hex: '#2F2A26', nombre: 'Grafeno' },
    { hex: '#1A1919FF', nombre: 'Óxido suave' }
  ];
  // Iconos Font Awesome disponibles
  iconosDisponibles = [
    { icono: 'fa-list', categoria: 'Listas' },
    { icono: 'fa-check-circle', categoria: 'Listas' },
    { icono: 'fa-clipboard-list', categoria: 'Listas' },
    { icono: 'fa-tasks', categoria: 'Listas' },
    { icono: 'fa-calendar', categoria: 'Tiempo' },
    { icono: 'fa-calendar-alt', categoria: 'Tiempo' },
    { icono: 'fa-clock', categoria: 'Tiempo' },
    { icono: 'fa-hourglass-half', categoria: 'Tiempo' },
    { icono: 'fa-briefcase', categoria: 'Trabajo' },
    { icono: 'fa-laptop', categoria: 'Trabajo' },
    { icono: 'fa-folder', categoria: 'Trabajo' },
    { icono: 'fa-file-alt', categoria: 'Trabajo' },
    { icono: 'fa-home', categoria: 'Personal' },
    { icono: 'fa-user', categoria: 'Personal' },
    { icono: 'fa-heart', categoria: 'Personal' },
    { icono: 'fa-star', categoria: 'Personal' },
    { icono: 'fa-shopping-cart', categoria: 'Compras' },
    { icono: 'fa-shopping-bag', categoria: 'Compras' },
    { icono: 'fa-gift', categoria: 'Compras' },
    { icono: 'fa-tag', categoria: 'Compras' },
    { icono: 'fa-lightbulb', categoria: 'Ideas' },
    { icono: 'fa-brain', categoria: 'Ideas' },
    { icono: 'fa-rocket', categoria: 'Ideas' },
    { icono: 'fa-bullseye', categoria: 'Ideas' },
    { icono: 'fa-book', categoria: 'Educación' },
    { icono: 'fa-graduation-cap', categoria: 'Educación' },
    { icono: 'fa-pen', categoria: 'Educación' },
    { icono: 'fa-pencil-alt', categoria: 'Educación' },
    { icono: 'fa-dumbbell', categoria: 'Salud' },
    { icono: 'fa-heartbeat', categoria: 'Salud' },
    { icono: 'fa-running', categoria: 'Salud' },
    { icono: 'fa-medkit', categoria: 'Salud' },
    { icono: 'fa-utensils', categoria: 'Comida' },
    { icono: 'fa-coffee', categoria: 'Comida' },
    { icono: 'fa-pizza-slice', categoria: 'Comida' },
    { icono: 'fa-apple-alt', categoria: 'Comida' },
    { icono: 'fa-plane', categoria: 'Viajes' },
    { icono: 'fa-map-marked-alt', categoria: 'Viajes' },
    { icono: 'fa-suitcase', categoria: 'Viajes' },
    { icono: 'fa-camera', categoria: 'Viajes' },
    { icono: 'fa-code', categoria: 'Tech' },
    { icono: 'fa-desktop', categoria: 'Tech' },
    { icono: 'fa-mobile-alt', categoria: 'Tech' },
    { icono: 'fa-bug', categoria: 'Tech' },
    { icono: 'fa-paint-brush', categoria: 'Arte' },
    { icono: 'fa-palette', categoria: 'Arte' },
    { icono: 'fa-music', categoria: 'Arte' },
    { icono: 'fa-film', categoria: 'Arte' },
    { icono: 'fa-dollar-sign', categoria: 'Finanzas' },
    { icono: 'fa-chart-line', categoria: 'Finanzas' },
    { icono: 'fa-piggy-bank', categoria: 'Finanzas' },
    { icono: 'fa-wallet', categoria: 'Finanzas' }
  ];

  categoriaSeleccionada: string = 'Listas';

  private destroy$ = new Subject<void>();

  constructor(
    private listasService: ListasService,
    private router: Router,
    private compartirService: CompartirService,
    private notificacionesService: NotificacionesService
  ) { }

  async ngOnInit() {
    await this.cargarListas();

    // Suscribirse a cambios en las listas
    this.listasService.listasCambiadas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cargarListas();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

async cargarListas() {
  this.isLoading = true;
  this.errorMessage = '';

  try {
    console.log('🔵 Cargando MIS listas...');
    
    // Obtener TODAS las listas
    const todasLasListas = await this.listasService.obtenerListas();
    console.log('📊 Total de listas obtenidas:', todasLasListas.length);
    
    // ✅ Filtrar: SOLO mis listas propias (que YO creé)
    // ✅ CONVERTIR compartible a booleano para evitar problemas con 0/1
    this.listas = todasLasListas
      .filter((lista: any) => {
        // Mostrar SOLO si soy el propietario original
        const esPropietario = lista.esPropietario === true || lista.esPropietario === 1;
        
        console.log(`Lista "${lista.nombre}" (ID: ${lista.idLista}):`, {
          compartible: lista.compartible,
          esPropietario: lista.esPropietario,
          idUsuario: lista.idUsuario,
          seIncluye: esPropietario
        });
        
        return esPropietario;
      })
      .map((lista: any) => ({
        ...lista,
        // ✅ CRÍTICO: Convertir compartible de number (0/1) a boolean
        compartible: !!lista.compartible || lista.compartible === 1 || lista.compartible === true,
        // ✅ También normalizar esPropietario
        esPropietario: !!lista.esPropietario || lista.esPropietario === 1,
        // ✅ Normalizar importante
        importante: !!lista.importante || lista.importante === 1
      }));

    console.log('✅ MIS listas filtradas:', this.listas.length);
    console.log('Listas finales:', this.listas.map(l => ({
      id: l.idLista,
      nombre: l.nombre,
      compartible: l.compartible,
      claveCompartir: l.claveCompartir
    })));

    if (!Array.isArray(this.listas)) {
      console.warn('obtenerListas() no devolvió un array válido');
      this.listas = [];
    }

  } catch (error: any) {
    console.error('❌ Error al cargar listas:', error);

    if (error.status === 401) {
      this.errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    } else if (error.status === 403) {
      this.errorMessage = 'No tienes permisos para ver estas listas.';
    } else {
      this.errorMessage = 'No se pudieron cargar las listas. Por favor, intenta de nuevo.';
    }

    this.listas = [];
  } finally {
    this.isLoading = false;
  }
}

  abrirLista(idLista: number) {
    if (!idLista) {
      console.error('ID de lista inválido:', idLista);
      return;
    }
    this.router.navigate(['/app/lista', idLista]);
  }

  async recargarListas() {
    await this.cargarListas();
  }

  // Métodos de edición
  editarLista(event: Event, lista: Lista) {
    event.stopPropagation();
    // Crear una copia para editar
    this.listaAEditar = { ...lista };
  }

  cancelarEdicion() {
    this.listaAEditar = null;
  }

  async guardarEdicion(event: Event) {
    event.preventDefault();

    if (!this.listaAEditar || !this.listaAEditar.idLista) {
      return;
    }

    try {
      await this.listasService.actualizarLista(
        this.listaAEditar.idLista,
        {
          nombre: this.listaAEditar.nombre,
          color: this.listaAEditar.color,
          icono: this.listaAEditar.icono,
          importante: this.listaAEditar.importante
        }
      );

      this.listaAEditar = null;
      await this.cargarListas();
    } catch (error) {
      console.error('Error al actualizar lista:', error);
      this.notificacionesService.error('Error al actualizar la lista. Por favor, intenta de nuevo.');
      //alert('Error al actualizar la lista. Por favor, intenta de nuevo.');
    }
  }

  // Métodos de eliminación
  confirmarEliminar(event: Event, lista: Lista) {
    event.stopPropagation();
    this.listaAEliminar = lista;
  }

  cancelarEliminar() {
    this.listaAEliminar = null;
  }

  async eliminarLista() {
    if (!this.listaAEliminar || !this.listaAEliminar.idLista) {
      return;
    }

    try {
      await this.listasService.eliminarLista(this.listaAEliminar.idLista);
      this.listaAEliminar = null;
      await this.cargarListas();
    } catch (error) {
      console.error('Error al eliminar lista:', error);
      this.notificacionesService.error('Error al eliminar la lista. Por favor, intenta de nuevo.');
      //alert('Error al eliminar la lista. Por favor, intenta de nuevo.');
    }
  }
  // Método para marcar/desmarcar como importante
  async toggleImportante(event: Event, lista: Lista) {
    event.stopPropagation();

    if (!lista.idLista) {
      return;
    }

    try {
      await this.listasService.actualizarLista(
        lista.idLista,
        {
          importante: !lista.importante
        }
      );

      await this.cargarListas();
    } catch (error) {
      console.error('Error al actualizar lista:', error);
      this.notificacionesService.error('Error al actualizar la lista. Por favor, intenta de nuevo.');
      //alert('Error al actualizar la lista. Por favor, intenta de nuevo.');
    }
  }

  // Métodos auxiliares
  get iconosFiltrados() {
    return this.iconosDisponibles.filter(
      item => item.categoria === this.categoriaSeleccionada
    );
  }

  get categorias() {
    return [...new Set(this.iconosDisponibles.map(item => item.categoria))];
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    const iconoLimpio = icono.trim();
    return !iconoLimpio.startsWith('fa');
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-clipboard-list';
    }

    const iconoLimpio = icono.trim();

    // Si ya tiene 'fas ' o 'far '
    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    // Si solo tiene 'fa-algo', agregar 'fas'
    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    return 'fas fa-clipboard-list';
  }

  abrirModalCompartir(event: Event, lista: Lista) {
    event.stopPropagation();

    // Debug
    this.debugLista(lista.idLista!);
    //console.log('Abriendo modal para lista:', lista);

    if (!lista.idLista) {
      console.error('Lista sin ID válido:', lista);
      return;
    }

    this.listaParaCompartir = {
      idLista: lista.idLista,
      nombre: lista.nombre,
      compartible: lista.compartible
    };
    this.modalCompartirAbierto = true;
  }

  cerrarModalCompartir() {
    this.modalCompartirAbierto = false;
    this.listaParaCompartir = null;
    // Recargar listas para reflejar cambios
    this.cargarListas();
  }



  alCompartir(clave: string) {
    //console.log('✅ Clave recibida del modal (de la BD):', clave);

    if (!this.listaParaCompartir?.idLista) {
      console.error('❌ No hay lista seleccionada para compartir');
      this.notificacionesService.error('Error: No se pudo identificar la lista');
      return;
    }

    // ✅ ACTUALIZAR INMEDIATAMENTE el estado local con la clave que YA viene del modal
    const listaIndex = this.listas.findIndex(l => l.idLista === this.listaParaCompartir?.idLista);
    if (listaIndex !== -1) {
      this.listas[listaIndex].compartible = true;
      this.listas[listaIndex].claveCompartir = clave; // ✅ Usar la clave del modal
    }

    this.notificacionesService.exito(`Lista compartida con clave: ${clave}`);
    
    // Recargar para sincronizar con el servidor
    setTimeout(() => {
      this.cargarListas();
    }, 300);
  }
  
  async debugLista(idLista: number) {
    try {
      const lista = await this.listasService.obtenerLista(idLista);
      //console.log('Debug - Lista:', lista);
    } catch (error) {
      //console.error('Debug - Error al obtener lista:', error);
    }
  }
}