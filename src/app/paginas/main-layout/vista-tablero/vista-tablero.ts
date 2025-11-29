import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoriasService, Categoria } from '../../../core/services/categorias/categorias';
import { ListasService, Lista } from '../../../core/services/listas/listas';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { ColumnaTableroComponent } from '../../../componentes/principal/columna-tablero/columna-tablero';
import { ModalCompartirComponent } from '../../../componentes/modales/modal-compartir/modal-compartir';
import { ModalListaComponent } from '../../../componentes/modales/modal-lista/modal-lista';
import { ModalUsuariosCategoriaComponent } from '../../../componentes/modales/modal-usuarios-cat/modal-usuarios-cat';
import { PanelDetallesComponent } from '../../../componentes/principal/panel-detalles/panel-detalles';
import { NotificacionesService } from '../../../core/services/notification/notification';
import { NotificacionComponent } from '../../../componentes/principal/notification/notification';
import { ModalPerfilUsuarioComponent } from '../../../componentes/modales/modal-perfil-usuario/modal-perfil-usuario';
import { AuthService } from '../../../core/services/authentication/authentication';

export interface PerfilUsuario {
  idUsuario: number;
  nombre: string;
  correo: string;
  telefono?: string;
  cargo?: string;
  bio?: string;
  redesSociales?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
  };
  rol?: string;
  esCreador?: boolean;
}

interface ListaConTareas extends Lista {
  tareas?: Tarea[];
  cargando?: boolean;
}

interface UsuarioCompartido {
  idUsuario: number;
  nombre: string;
  email: string;
  rol: string;
}

@Component({
  selector: 'app-vista-tablero',
  standalone: true,
  imports: [
    CommonModule,
    CdkDrag,
    CdkDropList,
    ColumnaTableroComponent,
    ModalCompartirComponent,
    ModalListaComponent,
    ModalUsuariosCategoriaComponent,
    PanelDetallesComponent,
    NotificacionComponent,
    ModalPerfilUsuarioComponent
  ],
  templateUrl: './vista-tablero.html',
  styleUrl: './vista-tablero.css'
})
export class VistaTableroComponent implements OnInit {
  categoria: Categoria | null = null;
  listas: ListaConTareas[] = [];
  listasImportantes: ListaConTareas[] = [];
  listasNormales: ListaConTareas[] = [];
  cargando = true;

  // Modal compartir lista
  modalCompartirAbierto = false;
  listaSeleccionada: ListaConTareas | null = null;

  // Modal compartir categoría
  modalCompartirCategoriaAbierto = false;

  // Modal editar lista
  modalEditarListaAbierto = false;
  listaParaEditar: ListaConTareas | null = null;

  // Modal usuarios
  modalUsuariosAbierto = false;
  categoriaIdParaModal = 0;
  esPropietarioCategoria = false;
  esAdminCategoria = false;
  usuariosCompartidos: UsuarioCompartido[] = [];

  // Panel de detalles
  panelDetallesAbierto = false;
  tareaSeleccionadaId: number | null = null;
  puedeEditarTarea = true;

  // Modal de eliminación inline
  listaAEliminar: ListaConTareas | null = null;

  modalPerfilAbierto = false;
  usuarioSeleccionado: PerfilUsuario | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoriasService: CategoriasService,
    private listasService: ListasService,
    private tareasService: TareasService,
    private notificacionesService: NotificacionesService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      if (params['id']) {
        await this.cargarCategoria(+params['id']);
        // Intentar cargar usuarios pero no bloquear si falla
        try {
          await this.cargarUsuariosCompartidos(+params['id']);
        } catch (error) {
          // Silenciar error, ya se maneja en la función
        }
      }
    });
  }

  async cargarCategoria(idCategoria: number) {
    try {
      this.cargando = true;

      this.categoria = await this.categoriasService.obtenerCategoria(idCategoria);

      if (!this.categoria) {
        console.error('Categoría no encontrada');
        this.router.navigate(['/app/todas-tareas']);
        return;
      }

      this.categoriaIdParaModal = idCategoria;

      const listasData = await this.categoriasService.obtenerListasPorCategoria(idCategoria);

      console.log('📦 Listas recibidas del backend:', listasData);
      console.log('📦 Primera lista RAW:', listasData[0]);
      console.log('📦 Campo importante de primera lista:', {
        valor: listasData[0]?.importante,
        tipo: typeof listasData[0]?.importante,
        esUno: listasData[0]?.importante === 1,
        esTrue: listasData[0]?.importante === true,
        esString: listasData[0]?.importante === '1'
      });

      // ✅ TRANSFORMACIÓN EXPLÍCITA DE BOOLEANOS
      this.listas = await Promise.all(
        listasData.map(async (lista: Lista) => {
          const listaConTareas: ListaConTareas = {
            ...lista,
            importante: Boolean(lista.importante),  // Conversión directa a boolean
            compartible: Boolean(lista.compartible),
            tareas: [],
            cargando: true
          };

          try {
            const data = await this.listasService.obtenerListaConTareas(lista.idLista!);
            if (data && data.tareas) {
              listaConTareas.tareas = data.tareas;
            }
          } catch (error) {
            console.error(`Error al cargar tareas de lista ${lista.idLista}:`, error);
          } finally {
            listaConTareas.cargando = false;
          }

          return listaConTareas;
        })
      );

      this.separarListas();

    } catch (error) {
      console.error('Error al cargar categoría:', error);
    } finally {
      this.cargando = false;
    }
  }

  // REEMPLAZAR el método separarListas en vista-tablero.ts

  separarListas() {
    this.listasImportantes = this.listas.filter(lista => Boolean(lista.importante));
    this.listasNormales = this.listas.filter(lista => !Boolean(lista.importante));
  }

  async cargarUsuariosCompartidos(categoriaId: number) {
    try {
      const info = await this.categoriasService.obtenerInfoCompartidos(categoriaId);

      if (info) {
        this.usuariosCompartidos = info.usuarios || [];

        const usuarioActualId = this.getUserId();
        const usuarioActual = this.usuariosCompartidos.find(u => u.idUsuario === usuarioActualId);

        const esCreador = info.categoria?.esCreador || false;
        this.esPropietarioCategoria = usuarioActual?.rol === 'propietario' || esCreador;
        this.esAdminCategoria = usuarioActual?.rol === 'admin' || this.esPropietarioCategoria;
      }
    } catch (error) {
      console.error('Error al cargar usuarios compartidos:', error);
      // No mostrar error al usuario, simplemente no mostrar usuarios
      this.usuariosCompartidos = [];
      this.esPropietarioCategoria = true; // Dar permisos por defecto si falla
      this.esAdminCategoria = true;
    }
  }

  async onDropListaImportante(event: CdkDragDrop<ListaConTareas[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.listasImportantes, event.previousIndex, event.currentIndex);
    }
  }

  async onDropListaNormal(event: CdkDragDrop<ListaConTareas[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.listasNormales, event.previousIndex, event.currentIndex);
    }
  }

  async recargarLista(idLista: number) {
    const lista = this.listas.find(l => l.idLista === idLista);
    if (!lista) return;

    lista.cargando = true;
    try {
      const data = await this.listasService.obtenerListaConTareas(idLista);
      if (data && data.tareas) {
        lista.tareas = data.tareas;
      }
    } catch (error) {
      console.error(`Error al recargar tareas de lista ${idLista}:`, error);
    } finally {
      lista.cargando = false;
    }

    // Actualizar separación después de recargar
    this.separarListas();
  }

  volverAtras() {
    this.router.navigate(['/app/todas-tareas']);
  }

  // Modal compartir categoría
  abrirModalCompartirCategoria() {
    this.modalCompartirCategoriaAbierto = true;
  }

  cerrarModalCompartirCategoria() {
    this.modalCompartirCategoriaAbierto = false;
  }

  onCategoriaCompartida(event: any) {
    if (this.categoria && event.clave) {
      this.categoria.claveCompartir = event.clave;
      this.notificacionesService.exito('Categoría compartida exitosamente', 3000);
    }
  }

  // Modal compartir lista individual
  abrirModalCompartir(lista: ListaConTareas) {
    this.listaSeleccionada = lista;
    this.modalCompartirAbierto = true;
  }

  cerrarModalCompartir() {
    this.modalCompartirAbierto = false;
    this.listaSeleccionada = null;
  }

  onListaCompartida(event: any) {
    if (this.listaSeleccionada && event.clave) {
      this.listaSeleccionada.claveCompartir = event.clave;
      this.notificacionesService.exito('Lista compartida exitosamente', 3000);
    }
  }

  // Modal de usuarios
  abrirModalUsuarios() {
    this.modalUsuariosAbierto = true;
  }

  cerrarModalUsuarios() {
    this.modalUsuariosAbierto = false;
  }

  async onUsuariosActualizados() {
    if (this.categoria?.idCategoria) {
      await this.cargarUsuariosCompartidos(this.categoria.idCategoria);
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

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    if (icono.trim().startsWith('fa')) return false;
    return true;
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-th-large';
    }
    const iconoLimpio = icono.trim();
    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }
    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }
    return 'fas fa-th-large';
  }

  private getUserId(): number {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.idUsuario || user.id;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  editarLista(lista: ListaConTareas) {
    this.listaParaEditar = lista;
    this.modalEditarListaAbierto = true;
  }

  abrirModalNuevaLista() {
    this.listaParaEditar = null; // null = modo crear
    this.modalEditarListaAbierto = true;
  }

  cerrarModalEditarLista() {
    this.modalEditarListaAbierto = false;
    this.listaParaEditar = null;
  }

  async onListaEditada() {
    if (this.categoria?.idCategoria) {
      await this.cargarCategoria(this.categoria.idCategoria);
    }
  }

  //  MÉTODOS ACTUALIZADOS PARA MODAL INLINE
  confirmarEliminarLista(lista: ListaConTareas) {
    this.listaAEliminar = lista;
  }

  cancelarEliminarLista() {
    this.listaAEliminar = null;
  }

  eliminarLista() {
    if (!this.listaAEliminar?.idLista) return;

    this.listasService.eliminarLista(this.listaAEliminar.idLista).then(
      () => {
        this.listas = this.listas.filter(l => l.idLista !== this.listaAEliminar!.idLista);
        this.separarListas();
        this.notificacionesService.exito('Lista eliminada correctamente', 3000);
        this.listaAEliminar = null;
      }
    ).catch(
      (err: any) => {
        console.error('Error al eliminar lista:', err);
        this.notificacionesService.error('Error al eliminar la lista', 3000);
        this.listaAEliminar = null;
      }
    );
  }

  // Panel de detalles de tarea
  abrirPanelDetalles(idTarea: any) {
    // Convertir a número por si acaso
    const id = typeof idTarea === 'number' ? idTarea : parseInt(idTarea, 10);
    this.tareaSeleccionadaId = id;
    this.puedeEditarTarea = this.esAdminCategoria;
    this.panelDetallesAbierto = true;
  }

  cerrarPanelDetalles() {
    this.panelDetallesAbierto = false;
    this.tareaSeleccionadaId = null;
  }

  async onTareaGuardada() {
    // Recargar todas las listas para reflejar cambios
    if (this.categoria?.idCategoria) {
      const listasData = await this.categoriasService.obtenerListasPorCategoria(this.categoria.idCategoria);

      for (const lista of listasData) {
        const listaExistente = this.listas.find(l => l.idLista === lista.idLista);
        if (listaExistente) {
          await this.recargarLista(lista.idLista!);
        }
      }
    }
  }

  async abrirPerfilUsuario(usuario: UsuarioCompartido) {
    console.log('👤 Abriendo perfil de usuario:', usuario);

    // Mostrar datos básicos inmediatamente
    this.usuarioSeleccionado = {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.email,
      telefono: undefined,
      cargo: undefined,
      bio: undefined,
      redesSociales: undefined,
      rol: usuario.rol,
      esCreador: false
    };

    this.modalPerfilAbierto = true;

    // 🔄 Cargar perfil completo del backend
    this.authService.obtenerPerfilPorId(usuario.idUsuario).subscribe({
      next: (perfilCompleto) => {
        console.log('✅ Perfil completo obtenido:', perfilCompleto);

        // Actualizar con datos completos
        if (this.usuarioSeleccionado && this.usuarioSeleccionado.idUsuario === perfilCompleto.idUsuario) {
          this.usuarioSeleccionado = {
            idUsuario: perfilCompleto.idUsuario,
            nombre: perfilCompleto.nombre,
            correo: perfilCompleto.email,
            telefono: perfilCompleto.telefono || undefined,
            cargo: perfilCompleto.cargo || undefined,
            bio: perfilCompleto.bio || undefined,
            redesSociales: perfilCompleto.redes_sociales || undefined,
            rol: usuario.rol,
            esCreador: false
          };
        }
      },
      error: (error) => {
        console.warn('⚠️ No se pudo cargar perfil completo:', error);
        // Mantener datos básicos si falla la carga
      }
    });
  }

  // Agregar método para cerrar modal de perfil (después de abrirPerfilUsuario)
  cerrarPerfilUsuario() {
    this.modalPerfilAbierto = false;
    this.usuarioSeleccionado = null;
  }
}