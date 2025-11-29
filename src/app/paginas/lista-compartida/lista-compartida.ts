import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListasService, Lista } from '../../core/services/listas/listas';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CompartirService } from '../../core/services/compartir/compartir';
import { ModalUnirseComponent } from '../../componentes/modales/modal-unirse/modal-unirse';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-lista-compartida',
  standalone: true,
  imports: [CommonModule, ModalUnirseComponent],
  templateUrl: './lista-compartida.html',
  styleUrl: './lista-compartida.css'
})
export class ListaCompartidaComponent implements OnInit, OnDestroy {
  listas: Lista[] = [];
  isLoading = false;
  errorMessage = '';
  modalUnirseAbierto = false;

  // Estado del modal de confirmación
  modalConfirmacion = {
    abierto: false,
    titulo: '',
    mensaje: '',
    tipo: '' as 'salir' | 'descompartir',
    lista: null as any
  };

  private destroy$ = new Subject<void>();

  constructor(
    private listasService: ListasService,
    private compartirService: CompartirService,
    private router: Router,
    private notificacionesService: NotificacionesService 
  ) { }

  async ngOnInit() {
    await this.cargarListasCompartidas();

    // Suscribirse a cambios en las listas
    this.listasService.listasCambiadas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cargarListasCompartidas();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

async cargarListasCompartidas() {
  this.isLoading = true;
  this.errorMessage = '';

  try {
    console.log('🔵 Cargando listas compartidas...');
    
    // ✅ CAMBIO: Usar listasService en lugar de compartirService
    const listasRecibidas = await this.listasService.obtenerListasCompartidas();
    
    console.log('🟢 Respuesta del backend:', listasRecibidas);
    console.log('📊 Total listas recibidas:', listasRecibidas.length);
    
    // El backend ya devuelve el array correcto
    this.listas = listasRecibidas;
    
    console.log('✅ Listas compartidas cargadas:', this.listas.length);
    console.log('Listas:', this.listas.map(l => ({ 
      nombre: l.nombre, 
      idLista: l.idLista,
      compartible: l.compartible,
      esPropietario: l.esPropietario,
      idCategoria: l.idCategoria,
      nombreCategoria: l.nombreCategoria
    })));
    
    this.isLoading = false;

  } catch (error: any) {
    console.error('❌ Error al cargar listas compartidas:', error);
    
    if (error.status === 401) {
      this.errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    } else if (error.status === 403) {
      this.errorMessage = 'No tienes permisos para ver estas listas.';
    } else {
      this.errorMessage = 'No se pudieron cargar las listas compartidas.';
    }
    
    this.listas = [];
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
    await this.cargarListasCompartidas();
  }

  async salirDeLista(event: Event, lista: any) {
    event.stopPropagation();

    if (!lista.idLista) return;

    // Verificar si es propietario
    if (lista.esPropietario) {
      this.abrirModalConfirmacion(
        'Descompartir lista',
        `¿Estás seguro que deseas descompartir "${lista.nombre}"? Todos los usuarios perderán acceso a esta lista.`,
        'descompartir',
        lista
      );
    } else {
      this.abrirModalConfirmacion(
        'Salir de lista',
        `¿Estás seguro que deseas salir de "${lista.nombre}"? Ya no tendrás acceso a esta lista.`,
        'salir',
        lista
      );
    }
  }

  abrirModalConfirmacion(titulo: string, mensaje: string, tipo: 'salir' | 'descompartir', lista: any) {
    this.modalConfirmacion = {
      abierto: true,
      titulo,
      mensaje,
      tipo,
      lista
    };
  }

  cerrarModalConfirmacion() {
    this.modalConfirmacion = {
      abierto: false,
      titulo: '',
      mensaje: '',
      tipo: 'salir',
      lista: null
    };
  }

  async confirmarAccion() {
    if (!this.modalConfirmacion.lista?.idLista) return;

    try {
      if (this.modalConfirmacion.tipo === 'salir') {
        await this.compartirService.salir('lista', this.modalConfirmacion.lista.idLista).toPromise();
      } else {
        await this.compartirService.descompartir('lista', this.modalConfirmacion.lista.idLista).toPromise();
      }
      
      this.cerrarModalConfirmacion();
      await this.cargarListasCompartidas();
    } catch (error) {
      console.error(`Error al ${this.modalConfirmacion.tipo}:`, error);
      this.notificacionesService.error(`Error al ${this.modalConfirmacion.tipo === 'salir' ? 'salir de' : 'descompartir'} la lista. Por favor, intenta de nuevo.`);
      //alert(`Error al ${this.modalConfirmacion.tipo === 'salir' ? 'salir de' : 'descompartir'} la lista. Por favor, intenta de nuevo.`);
    }
  }

  // Métodos auxiliares
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

    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    return 'fas fa-clipboard-list';
  }

  abrirModalUnirse() {
    this.modalUnirseAbierto = true;
  }

  cerrarModalUnirse() {
    this.modalUnirseAbierto = false;
  }

  async alUnirse() {
    await this.cargarListasCompartidas();
    this.cerrarModalUnirse();
  }
}