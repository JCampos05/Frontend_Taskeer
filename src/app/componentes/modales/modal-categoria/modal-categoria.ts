import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../../../core/services/categorias/categorias';
import { NotificacionesService } from '../../../core/services/notification/notification';
import { ModalCompartirComponent } from '../modal-compartir/modal-compartir';
import { CompartirService } from '../../../core/services/compartir/compartir';

@Component({
  selector: 'app-modal-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCompartirComponent],
  templateUrl: './modal-categoria.html',
  styleUrl: './modal-categoria.css' 
})
export class ModalCategoriaComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() categoriaEditando: any = null;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() categoriaGuardada = new EventEmitter<void>();

  nombreCategoria: string = '';
  compartible: boolean = false;
  claveCompartir: string = '';
  
  // Para el modal de compartir
  modalCompartirAbierto = false;
  categoriaParaCompartir: any = null;
  
  // Para el modal de confirmación de descompartir
  modalDescompartirAbierto = false;
  procesandoDescompartir = false;

  // ✅ NUEVO: Para unirse a categoría compartida
  claveUnirse: string = '';
  errorClaveUnirse: string = '';
  procesandoUnirse: boolean = false;

  constructor(
    private categoriasService: CategoriasService,
    private notificacionesService: NotificacionesService,
    private compartirService: CompartirService
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.inicializarFormulario();
    }
  }

  inicializarFormulario() {
    if (this.categoriaEditando) {
      this.nombreCategoria = this.categoriaEditando.nombre;
      this.compartible = this.categoriaEditando.compartible || false;
      this.claveCompartir = this.categoriaEditando.claveCompartir || '';
    } else {
      this.nombreCategoria = '';
      this.compartible = false;
      this.claveCompartir = '';
    }
    
    // Limpiar campos de unirse
    this.claveUnirse = '';
    this.errorClaveUnirse = '';
    this.procesandoUnirse = false;
  }

  async guardar() {
    if (!this.nombreCategoria.trim()) {
      this.notificacionesService.advertencia('El nombre de la categoría es requerido');
      return;
    }

    try {
      if (this.categoriaEditando) {
        // Al editar, solo actualizar el nombre
        await this.categoriasService.actualizarCategoria(
          this.categoriaEditando.idCategoria,
          { nombre: this.nombreCategoria }
        );
        this.notificacionesService.exito('Categoría actualizada exitosamente');
        
        // Si se activó compartible por primera vez, abrir modal
        if (this.compartible && !this.categoriaEditando.compartible) {
          this.categoriaParaCompartir = {
            ...this.categoriaEditando,
            nombre: this.nombreCategoria,
            compartible: true
          };
          this.modalCompartirAbierto = true;
        } else {
          this.categoriaGuardada.emit();
          this.cerrar();
        }
      } else {
        // Al crear, enviar nombre y compartible
        const categoriaData: any = {
          nombre: this.nombreCategoria,
          compartible: this.compartible
        };
        
        const response = await this.categoriasService.crearCategoria(categoriaData);
        this.notificacionesService.exito('Categoría creada exitosamente');
        
        // Si es compartible, abrir modal automáticamente
        if (this.compartible && response.data) {
          this.categoriaParaCompartir = response.data;
          this.modalCompartirAbierto = true;
        } else {
          this.categoriaGuardada.emit();
          this.cerrar();
        }
      }
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      this.notificacionesService.error('Error al guardar la categoría');
    }
  }

  // ✅ NUEVO: Unirse a categoría compartida mediante clave
  async unirseCategoria() {
    if (!this.claveUnirse || this.claveUnirse.length < 6) {
      this.errorClaveUnirse = 'La clave debe tener al menos 6 caracteres';
      return;
    }

    // Validar formato de clave (solo letras y números)
    const claveRegex = /^[A-Z0-9]+$/i;
    if (!claveRegex.test(this.claveUnirse)) {
      this.errorClaveUnirse = 'La clave solo puede contener letras y números';
      return;
    }

    this.procesandoUnirse = true;
    this.errorClaveUnirse = '';

    try {
      const response: any = await this.compartirService.unirseCategoriaPorClave(
        this.claveUnirse.toUpperCase()
      ).toPromise();

      if (response && response.categoria) {
        const mensaje = response.listasAccedidas > 0
          ? `Te has unido a "${response.categoria.nombre}". También obtuviste acceso a ${response.listasAccedidas} lista(s).`
          : `Te has unido a "${response.categoria.nombre}" exitosamente.`;
        
        this.notificacionesService.exito(mensaje);
        
        // Limpiar y cerrar
        this.claveUnirse = '';
        this.categoriaGuardada.emit();
        
        // Cerrar modal después de un momento
        setTimeout(() => {
          this.cerrar();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error al unirse a categoría:', error);
      
      // Manejar errores específicos
      if (error.status === 404) {
        this.errorClaveUnirse = 'No se encontró ninguna categoría con esa clave';
      } else if (error.status === 400) {
        this.errorClaveUnirse = error.error?.error || 'Clave inválida o ya tienes acceso a esta categoría';
      } else {
        this.errorClaveUnirse = 'Error al unirse a la categoría. Intenta nuevamente';
      }
    } finally {
      this.procesandoUnirse = false;
    }
  }

  // Abrir modal de compartir desde el botón
  abrirModalCompartir() {
    if (this.categoriaEditando) {
      this.categoriaParaCompartir = this.categoriaEditando;
      this.modalCompartirAbierto = true;
    }
  }

  cerrarModalCompartir() {
    this.modalCompartirAbierto = false;
    this.categoriaParaCompartir = null;
    // Después de compartir, cerrar el modal principal
    this.categoriaGuardada.emit();
    this.cerrar();
  }

  // ✅ ACTUALIZADO: Recibir información de listas compartidas
  alCompartir(data: any) {
    // Manejar tanto string (retrocompatibilidad) como objeto
    if (typeof data === 'string') {
      this.notificacionesService.exito(`Categoría compartida. Clave: ${data}`);
      this.claveCompartir = data;
    } else {
      const clave = data.clave || data;
      const mensaje = data.listasCompartidas > 0 
        ? `Categoría compartida exitosamente. ${data.listasCompartidas} lista(s) también fueron compartidas.`
        : `Categoría compartida exitosamente.`;
      
      this.notificacionesService.exito(mensaje);
      this.claveCompartir = clave;
    }
  }

  // Abrir modal de confirmación para descompartir
  abrirModalDescompartir() {
    this.modalDescompartirAbierto = true;
  }

  cerrarModalDescompartir() {
    this.modalDescompartirAbierto = false;
  }

  // Descompartir categoría
  async confirmarDescompartir() {
    if (!this.categoriaEditando) return;

    this.procesandoDescompartir = true;
    
    try {
      // Llamar al servicio para descompartir
      await this.compartirService.descompartir('categoria', this.categoriaEditando.idCategoria).toPromise();
      
      // Actualizar el estado local
      this.compartible = false;
      this.claveCompartir = '';
      
      this.notificacionesService.exito('Categoría descompartida exitosamente');
      this.modalDescompartirAbierto = false;
      this.procesandoDescompartir = false;
      
      // Recargar datos
      this.categoriaGuardada.emit();
      this.cerrar();
    } catch (error) {
      console.error('Error al descompartir:', error);
      this.notificacionesService.error('Error al descompartir la categoría');
      this.procesandoDescompartir = false;
    }
  }

  cerrar() {
    this.nombreCategoria = '';
    this.compartible = false;
    this.claveCompartir = '';
    this.claveUnirse = '';
    this.errorClaveUnirse = '';
    this.procesandoUnirse = false;
    this.cerrarModal.emit();
  }
}