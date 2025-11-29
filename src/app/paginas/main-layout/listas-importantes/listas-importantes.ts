import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ListasService, Lista } from '../../../core/services/listas/listas';
import { Router } from '@angular/router';
import { NotificacionesService } from '../../../core/services/notification/notification';

@Component({
  selector: 'app-listas-importantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listas-importantes.html',
  styleUrl: './listas-importantes.css'
})
export class ListasImportantesComponent implements OnInit, OnDestroy {
  listas: Lista[] = [];
  private listasSubscription?: Subscription;
  listaAEliminar: Lista | null = null;
  listaAEditar: Lista | null = null;

  // Colores predefinidos
  coloresPredefinidos = [
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

  constructor(
    private listasService: ListasService,
    private router: Router,
    private notificacionesService: NotificacionesService 
  ) {}

  async ngOnInit() {
    await this.cargarListasImportantes();
    
    // Suscribirse a cambios en las listas
    this.listasSubscription = this.listasService.listasCambiadas$.subscribe(() => {
      this.cargarListasImportantes();
    });
  }

  ngOnDestroy() {
    if (this.listasSubscription) {
      this.listasSubscription.unsubscribe();
    }
  }

  async cargarListasImportantes() {
    try {
      this.listas = await this.listasService.obtenerListasImportantes();
    } catch (error) {
      console.error('Error al cargar listas importantes:', error);
    }
  }

  abrirLista(idLista: number) {
    this.router.navigate(['/app/lista', idLista]);
  }

  // Método para marcar/desmarcar como importante
  async toggleImportante(lista: Lista, event: Event) {
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

      await this.cargarListasImportantes();
    } catch (error) {
      console.error('Error al actualizar lista:', error);
      this.notificacionesService.error('Error al actualizar la lista. Por favor, intenta de nuevo.');
      //alert('Error al actualizar la lista. Por favor, intenta de nuevo.');
    }
  }

  // Métodos de edición
  editarLista(lista: Lista, event: Event) {
    event.stopPropagation();
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
      await this.cargarListasImportantes();
    } catch (error) {
      console.error('Error al actualizar lista:', error);
      this.notificacionesService.error('Error al actualizar la lista. Por favor, intenta de nuevo.');
      //alert('Error al actualizar la lista. Por favor, intenta de nuevo.');
    }
  }

  // Métodos de eliminación
  confirmarEliminar(lista: Lista, event: Event) {
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
      await this.cargarListasImportantes();
    } catch (error) {
      console.error('Error al eliminar lista:', error);
      this.notificacionesService.error('Error al eliminar la lista. Por favor, intenta de nuevo.');
      //alert('Error al eliminar la lista. Por favor, intenta de nuevo.');
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
}