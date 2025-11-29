import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CategoriasService } from '../../../core/services/categorias/categorias';
import { ListasService } from '../../../core/services/listas/listas';
import { NotificacionesService } from '../../../core/services/notification/notification';
import { ModalCompartirComponent } from '../../modales/modal-compartir/modal-compartir';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ModalCompartirComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = true;
  @Output() abrirModalCategoriaEvent = new EventEmitter<void>();
  @Output() abrirModalListaEvent = new EventEmitter<number | null>();
  @Output() sidebarCollapsedChange = new EventEmitter<boolean>();

  categorias: any[] = [];
  listasSinCategoria: any[] = [];
  categoriaExpandida: { [key: string]: boolean } = {};
  categoriaAEliminar: any = null;
  modalCompartirAbierto = false;
  categoriaParaCompartir: any = null;
  tipoCompartir: 'categoria' | 'lista' = 'categoria';

  // Nuevas propiedades para colapsar y tema
  isCollapsed: boolean = false;
  isLightMode: boolean = false;

  categoriaCompartirAbierta: any = null;
  itemParaCompartir: any = null;

  rutaActual: string = '';
  // Suscripción para detectar cambios
  private listasSubscription?: Subscription;

  constructor(
    private categoriasService: CategoriasService,
    private listasService: ListasService,
    private router: Router,
    private notificacionesService: NotificacionesService
  ) { }

  ngOnInit() {
    this.cargarCategorias();

    // Detectar cambios de ruta para marcar activos
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.rutaActual = event.url;
      });

    // Inicializar ruta actual
    this.rutaActual = this.router.url;

    // Suscribirse a los cambios en las listas
    this.listasSubscription = this.listasService.listasCambiadas$.subscribe(() => {
      this.cargarCategorias();
    });

    // Cargar preferencias del localStorage
    const savedTheme = localStorage.getItem('sidebar-theme');
    if (savedTheme === 'light') {
      this.isLightMode = true;
    }

    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed === 'true') {
      this.isCollapsed = true;
    }
  }

  ngOnDestroy() {
    // Limpiar la suscripción para evitar memory leaks
    if (this.listasSubscription) {
      this.listasSubscription.unsubscribe();
    }
  }

  // Toggle de colapsar sidebar
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebar-collapsed', this.isCollapsed.toString());
    this.sidebarCollapsedChange.emit(this.isCollapsed);
  }

  // Toggle de tema
  toggleTheme() {
    this.isLightMode = !this.isLightMode;
    localStorage.setItem('sidebar-theme', this.isLightMode ? 'light' : 'dark');
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;

    // Si empieza con 'fa', es un icono Font Awesome
    if (icono.trim().startsWith('fa')) {
      return false;
    }

    // Si es otra cosa (emoji), devolver true
    return true;
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    // Si no hay icono o es null
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-clipboard-list';
    }

    // Limpiar espacios
    const iconoLimpio = icono.trim();

    // Si ya tiene el prefijo 'fas ' o 'far '
    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    // Si empieza con 'fa-', agregar prefijo 'fas'
    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    // Default
    return 'fas fa-clipboard-list';
  }

  async cargarCategorias() {
    try {
      const categorias = await this.categoriasService.obtenerCategorias();

      for (const categoria of categorias) {
        const listas = await this.categoriasService.obtenerListasPorCategoria(categoria.idCategoria ?? 0);
        categoria.listas = listas;
      }

      this.listasSinCategoria = await this.listasService.obtenerListasSinCategoria();

      this.categorias = categorias;

    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  toggleCategoria(idCategoria: string) {
    this.categoriaExpandida[idCategoria] = !this.categoriaExpandida[idCategoria];
  }

  isCategoriaExpandida(idCategoria: string): boolean {
    return this.categoriaExpandida[idCategoria] || false;
  }

  // ==================== TOOLS ====================
  mostrarListasIndividuales() {
    this.router.navigate(['/app/listas-individuales']);
  }

  mostrarListasImportantes() {
    this.router.navigate(['/app/listas-importantes']);
  }

  mostrarCalendario() {
    this.router.navigate(['/app/calendar']);
  }

  mostrarListasCompartidas() {
    // Navegar a una ruta genérica de compartidas
    this.router.navigate(['/app/compartida/0']);
  }

  mostrarNotas() {
    this.router.navigate(['/app/notas']);
  }

  // ==================== VISTAS ====================
  cargarMiDia() {
    this.router.navigate(['/app/mi-dia']);
  }

  cargarMiSemana() {
    this.router.navigate(['/app/mi-semana']);
  }

  cargarTodasLasTareas() {
    this.router.navigate(['/app/todas-tareas']);
  }

  cargarPendientes() {
    this.router.navigate(['/app/pendientes']);
  }

  cargarEnProgreso() {
    this.router.navigate(['/app/progreso']);
  }

  cargarCompletadas() {
    this.router.navigate(['/app/completadas']);
  }

  cargarTareasVencidas() {
    this.router.navigate(['/app/vencidas']);
  }

  // Método legacy para compatibilidad
  filtrarPorEstado(estado: string) {
    switch (estado) {
      case 'P':
        this.cargarPendientes();
        break;
      case 'N':
        this.cargarEnProgreso();
        break;
      case 'C':
        this.cargarCompletadas();
        break;
    }
  }

  // ==================== DETALLES ====================
  cargarTareasDeLista(idLista: number) {
    this.router.navigate(['/app/lista', idLista]);
  }

  cargarCategoria(idCategoria: number) {
    console.log('Función pendiente: mostrar categoría', idCategoria);
  }

  verTablero(idCategoria: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/app/tablero', idCategoria]);
  }

  // ==================== MODALS ====================
  abrirModalCategoria() {
    this.abrirModalCategoriaEvent.emit();
  }

  abrirModalLista(idCategoria: string | number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const categoriaId = idCategoria === 'sin-categoria' ? null : Number(idCategoria);
    this.abrirModalListaEvent.emit(categoriaId);
  }

  abrirModalListaSinCategoria() {
    this.abrirModalListaEvent.emit(null);
  }

  // ==================== ELIMINACIÓN DE CATEGORÍAS ====================
  confirmarEliminarCategoria(categoria: any, event: Event) {
    event.stopPropagation();
    this.categoriaAEliminar = categoria;
  }

  cancelarEliminarCategoria() {
    this.categoriaAEliminar = null;
  }

  async eliminarCategoria() {
    if (!this.categoriaAEliminar || !this.categoriaAEliminar.idCategoria) {
      return;
    }

    try {
      await this.categoriasService.eliminarCategoria(this.categoriaAEliminar.idCategoria);
      this.notificacionesService.exito('Categoría eliminada exitosamente');
      this.categoriaAEliminar = null;
      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      this.notificacionesService.error('Error al eliminar la categoría. Por favor, intenta de nuevo.');
    }
  }

  // ==================== COMPARTIR ====================

  // MÉTODO SIMPLE Y DIRECTO para compartir categoría
  compartirCategoria(categoria: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    this.itemParaCompartir = categoria;
    this.tipoCompartir = 'categoria';
    this.modalCompartirAbierto = true;
  }

  cerrarModalCompartir() {
    this.modalCompartirAbierto = false;
    this.itemParaCompartir = null;
    // Recargar categorías para reflejar cambios
    this.cargarCategorias();
  }

  // ✅ Manejar el evento compartido correctamente
  alCompartir(evento: any) {
    if (evento && evento.clave) {
      // Mensaje según el tipo
      if (evento.tipo === 'categoria') {
        if (evento.listasCompartidas > 0) {
          this.notificacionesService.exito(
            `Categoría compartida con clave: ${evento.clave}. Se compartieron ${evento.listasCompartidas} lista(s).`
          );
        } else {
          this.notificacionesService.exito(`Categoría compartida con clave: ${evento.clave}`);
        }
      } else {
        this.notificacionesService.exito(`Lista compartida con clave: ${evento.clave}`);
      }
    }

    this.cerrarModalCompartir();
  }

  // Toggle para mostrar/ocultar el dropdown de listas para compartir
  toggleCompartirListas(categoria: any, event: Event) {
    event.stopPropagation();

    if (this.categoriaCompartirAbierta?.idCategoria === categoria.idCategoria) {
      this.categoriaCompartirAbierta = null;
    } else {
      this.categoriaCompartirAbierta = categoria;
    }
  }

  // Cerrar el dropdown de listas
  cerrarCompartirListas() {
    this.categoriaCompartirAbierta = null;
  }

  // Compartir lista individual desde el dropdown
  compartirLista(lista: any) {


    this.itemParaCompartir = lista;
    this.tipoCompartir = 'lista';
    this.modalCompartirAbierto = true;
    this.categoriaCompartirAbierta = null; // Cerrar el dropdown
  }

  esRutaActiva(ruta: string): boolean {
    return this.rutaActual.includes(ruta);
  }

  esListaActiva(idLista: number): boolean {
    return this.rutaActual === `/app/lista/${idLista}`;
  }

  esTableroActivo(idCategoria: number): boolean {
    return this.rutaActual === `/app/tablero/${idCategoria}`;
  }
}