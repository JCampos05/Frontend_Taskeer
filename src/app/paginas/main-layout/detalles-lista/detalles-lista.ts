import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription, take } from 'rxjs';
import { ListasService } from '../../../core/services/listas/listas';
import { CompartirService, UsuarioCompartido, InfoCompartidos } from '../../../core/services/compartir/compartir';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { ChatService } from '../../../core/services/chat/chat';
import { SocketService } from '../../../core/services/sockets/sockets';
import { ColumnasComponent } from '../../../componentes/principal/columna/columna';
import { ModalUsuariosListaComponent } from '../../../componentes/modales/modal-usuarios-lista/modal-usuarios-lista';
import { ModalAsignarTareaComponent } from '../../../componentes/modales/modal-asignar-tarea/modal-asignar-tarea';
import { ChatComponent } from '../../../componentes/chat/chat/chat';
import { NotificationService } from '../../../core/services/notification-user/notification-user';
import { AuthService } from '../../../core/services/authentication/authentication';
import { ModalPerfilUsuarioComponent } from '../../../componentes/modales/modal-perfil-usuario/modal-perfil-usuario';
import { NotificacionesService } from '../../../core/services/notification/notification';


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
@Component({
  selector: 'app-detalle-lista',
  standalone: true,
  imports: [
    CommonModule,
    ColumnasComponent,
    ModalUsuariosListaComponent,
    ModalAsignarTareaComponent,
    ChatComponent,
    ModalPerfilUsuarioComponent
  ],
  templateUrl: './detalles-lista.html',
  styleUrl: './detalles-lista.css'
})
export class DetalleListaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(ColumnasComponent) columnasComponent?: ColumnasComponent;

  nombreLista: string = '';
  descripcionLista: string = '';
  iconoLista: string = '';
  colorLista: string = '';
  idLista: number = 0;
  idUsuarioActual: number = 0;
  idCreadorLista: number = 0;

  usuariosCompartidos: UsuarioCompartido[] = [];
  esPropietario = false;
  esAdmin = false;
  compartible = false;
  modalUsuariosAbierto = false;

  infoCompartidos: InfoCompartidos | null = null;

  // Asignación de tareas
  modalAsignarAbierto = false;
  tareaSeleccionada: Tarea | null = null;

  // ⭐ NUEVO: Chat
  chatAbierto = false;
  mensajesNoLeidos = 0;
  usuarioActual: any;
  mostrarBotonChat = false; // Nueva propiedad para controlar visibilidad

  modalPerfilAbierto = false;
  usuarioSeleccionado: PerfilUsuario | null = null;
  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listasService: ListasService,
    private compartirService: CompartirService,
    private tareasService: TareasService,
    private chatService: ChatService,
    private socketService: SocketService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private notificacionesService: NotificacionesService 
  ) {
    const authUsuario = localStorage.getItem('auth_usuario');
    if (authUsuario) {
      const usuarioData = JSON.parse(authUsuario);
      this.idUsuarioActual = usuarioData.idUsuario || 0;
      this.usuarioActual = usuarioData;
    } else {
      console.error('⚠️ No se encontró auth_usuario en localStorage');
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.actualizarPermisosColumnas());
  }

  ngOnDestroy() {
    // Limpiar subscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private actualizarPermisosColumnas() {
    if (this.columnasComponent) {
      this.columnasComponent.puedeEditar = this.puedeEditarTareas();
      this.columnasComponent.puedeEliminar = this.puedeEliminarTareas();
      this.columnasComponent.puedeAsignar = this.puedeAsignarTareas();
    }
  }

  async ngOnInit() {
    console.log('🎯 DetalleListaComponent ngOnInit iniciando...');

    this.route.params.subscribe(async params => {
      this.idLista = +params['id'];
      console.log('🎯 ID Lista cargado:', this.idLista);

      await this.cargarInfoLista();
      this.cargarInfoCompartidos();
    });

    // ✅ CRÍTICO: Verificar conexión SSE
    this.verificarConexionSSE();

    // ✅ Conectar socket si no está conectado
    this.conectarSocket();

    // ✅ Escuchar nuevos mensajes para actualizar contador
    this.suscribirseAMensajes();

    // ✅ Escuchar notificaciones de tareas
    this.suscribirseANotificacionesTareas();

    // ✅ NUEVO: Escuchar cambios en notificaciones para actualizar badge del chat
    this.suscribirseAMensajesChat();

    console.log('🎯 Mensajes no leídos inicial:', this.mensajesNoLeidos);
  }

  private verificarConexionSSE(): void {
    // Verificar cada 10 segundos si el SSE está conectado
    const intervalId = setInterval(() => {
      // Si hay token pero no hay notificaciones cargándose, reconectar
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔍 Verificando conexión SSE...');
        this.notificationService.reconectar();
      }
    }, 10000);

    // Limpiar interval al destruir el componente
    this.subscriptions.push({
      unsubscribe: () => clearInterval(intervalId)
    } as Subscription);
  }

  // ⭐ NUEVO: Conectar socket al iniciar
  private conectarSocket(): void {
    if (!this.socketService.isConnected) {
      const token = localStorage.getItem('token');
      if (token) {
        this.socketService.connect(token);
      }
    }
  }


  private suscribirseAMensajes(): void {
    const messageSub = this.socketService.onMessage().subscribe(mensaje => {
      console.log('📨 [WebSocket] Nuevo mensaje recibido:', mensaje);

      if (mensaje.idLista === this.idLista && !this.chatAbierto && mensaje.idUsuario !== this.idUsuarioActual) {
        this.mensajesNoLeidos++;
        console.log('🔔 Badge actualizado desde WebSocket:', this.mensajesNoLeidos);
      }
    });

    this.subscriptions.push(messageSub);

    const notifMensajeSub = this.notificationService.notificaciones$.subscribe(notificaciones => {
      const mensajesChat = notificaciones.filter(n =>
        !n.leida &&
        n.tipo === 'mensaje_chat' &&
        (n.datos?.listaId === this.idLista || n.datos?.listaId === this.idLista)
      );

      if (mensajesChat.length > 0 && !this.chatAbierto) {
        console.log(`🔔 [SSE] Badge actualizado a ${mensajesChat.length}`);
        this.mensajesNoLeidos = mensajesChat.length;
      }
    });

    this.subscriptions.push(notifMensajeSub);
  }


  private suscribirseAMensajesChat(): void {
    console.log('📬 Iniciando suscripción a mensajes de chat...');

    const chatNotifSub = this.notificationService
      .obtenerMensajesNoLeidosLista(this.idLista)
      .subscribe(cantidad => {
        // Solo actualizar si el chat está cerrado
        if (!this.chatAbierto) {
          console.log(`🔔 Badge del chat actualizado: ${this.mensajesNoLeidos} -> ${cantidad}`);
          this.mensajesNoLeidos = cantidad;
        }
      });

    this.subscriptions.push(chatNotifSub);
  }

  private suscribirseANotificacionesTareas(): void {
    console.log('📡 Suscribiéndose a notificaciones de tareas...');

    const notifSub = this.notificationService.notificaciones$.subscribe(notificaciones => {
      // ✅ Filtrar notificaciones relevantes para esta lista
      const notifsRelevantes = notificaciones.filter(n => {
        if (n.leida) return false;

        const listaIdNotif = n.datos?.listaId || n.datos?.listaId;

        const tiposRelevantes = [
          'tarea_asignada',
          'cambio_rol_lista',
          'invitacion_lista',
          'mensaje_chat',
          'otro'
        ];

        if (!tiposRelevantes.includes(n.tipo)) {
          return false;
        }

        // ✅ MENSAJE DE CHAT - Solo actualizar badge
        if (n.tipo === 'mensaje_chat') {
          const esDeLista = listaIdNotif === this.idLista;

          if (esDeLista && !this.chatAbierto) {
            this.mensajesNoLeidos++;
            console.log('💬 Badge chat actualizado:', this.mensajesNoLeidos);
          }

          return false; // No procesar más
        }

        // ✅ CAMBIO DE ROL - CRÍTICO: Solo si es para mí y de esta lista
        if (n.tipo === 'cambio_rol_lista') {
          const esParaMi = n.idUsuario === this.idUsuarioActual;
          const esDeLista = listaIdNotif === this.idLista;

          if (esParaMi && esDeLista) {
            console.log('🔄 CAMBIO DE ROL DETECTADO:');
            console.log('   Lista:', n.datos?.listaNombre);
            console.log('   Nuevo rol:', n.datos?.nuevoRol);
            console.log('   Rol anterior:', n.datos?.rolAnterior);
            return true; // ✅ Procesar esta notificación
          }

          return false;
        }

        // Invitaciones y revocaciones
        if (n.tipo === 'invitacion_lista' || (n.tipo === 'otro' && n.datos?.revocadoPor)) {
          return true;
        }

        if (!listaIdNotif || listaIdNotif !== this.idLista) {
          return false;
        }

        return true;
      });

      // ✅ Si hay notificaciones relevantes, procesar
      if (notifsRelevantes.length > 0) {
        console.log(`📋 ${notifsRelevantes.length} notificaciones relevantes detectadas`);

        // 1️⃣ TAREAS ASIGNADAS
        const hayTareasAsignadas = notifsRelevantes.some(n => n.tipo === 'tarea_asignada');
        if (hayTareasAsignadas && this.columnasComponent) {
          console.log('🔄 Recargando tareas por asignación...');
          this.columnasComponent.cargarTareasDeLista(this.idLista);
        }

        // 2️⃣ CAMBIO DE ROL - RECARGAR PERMISOS SIN RECARGAR PÁGINA
        const notifCambioRol = notifsRelevantes.find(n => n.tipo === 'cambio_rol_lista');
        if (notifCambioRol) {
          console.log('🔄 ===== CAMBIO DE ROL DETECTADO =====');
          console.log('   Lista:', notifCambioRol.datos?.listaNombre);
          console.log('   Nuevo rol:', notifCambioRol.datos?.nuevoRol);
          console.log('   Rol anterior:', notifCambioRol.datos?.rolAnterior);
          console.log('   Modificado por:', notifCambioRol.datos?.modificadoPor);

          // Mostrar toast/alert al usuario
          this.mostrarAlertaCambioRol(notifCambioRol);

          // Recargar permisos de la lista
          console.log('Recargando información de permisos...');
          this.cargarInfoCompartidos();

          // Actualizar permisos de columnas después de 1 segundo
          setTimeout(() => {
            this.actualizarPermisosColumnas();
            console.log('Permisos actualizados sin recargar página');
            console.log('   esPropietario:', this.esPropietario);
            console.log('   esAdmin:', this.esAdmin);
            console.log('   Puede editar:', this.puedeEditarTareas());
            console.log('   Puede eliminar:', this.puedeEliminarTareas());
            console.log('   Puede asignar:', this.puedeAsignarTareas());
            console.log('=====================================');
          }, 1000);
        }

        // 3INVITACIONES
        const hayInvitacion = notifsRelevantes.some(n => n.tipo === 'invitacion_lista');
        if (hayInvitacion) {
          console.log('Invitación detectada, recargando info compartidos...');
          this.cargarInfoCompartidos();
        }

        // 4️⃣ REVOCACIONES
        const hayRevocacion = notifsRelevantes.some(n =>
          n.tipo === 'otro' &&
          n.datos?.revocadoPor &&
          n.idUsuario === this.idUsuarioActual
        );

        if (hayRevocacion) {
          console.log('Acceso revocado, redirigiendo...');
          this.notificacionesService.advertencia('Su acceso a esta lista ha sido revocado, redirigiendo...');
          //alert('Tu acceso a esta lista ha sido revocado');
          setTimeout(() => {
            this.router.navigate(['/app/listas']);
          }, 1500);
        }
      }
    });

    this.subscriptions.push(notifSub);
  }


  async cargarInfoLista() {
    try {
      const lista = await this.listasService.obtenerListaConTareas(this.idLista);

      if (lista) {
        this.nombreLista = lista.nombre || '';
        this.descripcionLista = lista.descripcion || '';
        this.iconoLista = lista.icono || '';
        this.colorLista = lista.color || '#0052CC';
      }
    } catch (error) {
      console.error('Error al cargar información de lista:', error);
    }
  }

  cargarInfoCompartidos() {
    this.compartirService.obtenerInfoCompartidosLista(this.idLista).subscribe({
      next: (infoCompartidos) => {
        this.infoCompartidos = infoCompartidos;

        if (infoCompartidos) {
          this.usuariosCompartidos = infoCompartidos.usuarios || [];
          this.compartible = !!infoCompartidos.lista?.claveCompartir;

          const usuarioCreador = this.usuariosCompartidos.find(u => u.esCreador);
          this.idCreadorLista = usuarioCreador?.idUsuario || 0;

          this.esPropietario = this.idCreadorLista === this.idUsuarioActual;

          const tuRol = infoCompartidos.lista?.tuRol;
          this.esAdmin = tuRol === 'admin' || this.esPropietario;

          console.log('👥 Usuarios compartidos cargados:', this.usuariosCompartidos.length);

          // ✅ Determinar si mostrar botón de chat
          this.mostrarBotonChat = this.usuariosCompartidos.length > 1;
          console.log('👁️ Mostrar botón chat:', this.mostrarBotonChat);

          // ✅ CRÍTICO: Cargar mensajes no leídos INMEDIATAMENTE
          if (this.mostrarBotonChat) {
            console.log('🔄 CARGA INMEDIATA de mensajes no leídos...');

            // ✅ Cargar desde notificaciones primero (más rápido)
            this.cargarDesdeNotificaciones();

            // ✅ Luego confirmar con la API
            setTimeout(() => this.cargarMensajesNoLeidos(), 500);
          } else {
            console.log('⚠️ No se muestra chat (usuarios compartidos <= 1)');
            this.mensajesNoLeidos = 0;
          }
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar info compartidos:', error);
        this.compartible = false;
        this.usuariosCompartidos = [];
        this.mostrarBotonChat = false;
        this.mensajesNoLeidos = 0;
        this.verificarPropietarioDirecto();
      }
    });
    setTimeout(() => this.actualizarPermisosColumnas(), 100);
  }

  // ⭐ NUEVO: Cargar mensajes no leídos - MEJORADO
  /**
   * Cargar mensajes no leídos - VERSIÓN MEJORADA
   */
  private cargarMensajesNoLeidos(): void {
    console.log('📊 ===== CARGANDO MENSAJES NO LEÍDOS =====');
    console.log('📊 ID Lista:', this.idLista);

    if (!this.mostrarBotonChat) {
      console.log('⚠️ No se debe mostrar chat, abortando carga');
      return;
    }

    // ✅ Método combinado: API + Notificaciones
    this.chatService.obtenerNoLeidos(this.idLista).subscribe({
      next: (data) => {
        console.log('📊 Respuesta de obtenerNoLeidos (API):', data);
        if (data && data.length > 0) {
          const noLeidosAPI = data[0].mensajesNoLeidos || 0;

          // También verificar notificaciones
          this.notificationService.obtenerMensajesNoLeidosLista(this.idLista)
            .pipe(take(1))
            .subscribe(noLeidosNotif => {
              // Tomar el máximo entre ambos
              this.mensajesNoLeidos = Math.max(noLeidosAPI, noLeidosNotif);
              console.log(`✅ Badge actualizado: API=${noLeidosAPI}, Notif=${noLeidosNotif}, Final=${this.mensajesNoLeidos}`);
            });
        } else {
          // Fallback a notificaciones
          this.cargarDesdeNotificaciones();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar desde API:', error);
        this.cargarDesdeNotificaciones();
      }
    });
  }

  // ✅ NUEVO: Cargar desde notificaciones como fallback
  private cargarDesdeNotificaciones(): void {
    console.log('📊 Cargando mensajes no leídos desde notificaciones...');

    this.notificationService.notificaciones$.pipe(take(1)).subscribe(notificaciones => {
      console.log('📊 Total notificaciones:', notificaciones.length);

      const mensajesChat = notificaciones.filter(n => {
        const esNoLeida = !n.leida;
        const esMensajeChat = n.tipo === 'mensaje_chat';
        const esDeLista = n.datos?.listaId === this.idLista || n.datos?.listaId === this.idLista;

        console.log(`   - Notif ${n.idNotificacion}:`, {
          tipo: n.tipo,
          leida: n.leida,
          listaId: n.datos?.listaId,
          coincide: esNoLeida && esMensajeChat && esDeLista
        });

        return esNoLeida && esMensajeChat && esDeLista;
      });

      this.mensajesNoLeidos = mensajesChat.length;
      console.log('Badge actualizado desde notificaciones:', this.mensajesNoLeidos);
      console.log('========================================');
    });
  }


  private mostrarAlertaCambioRol(notif: any): void {
    const nuevoRol = notif.datos?.nuevoRol;
    const listaNombre = notif.datos?.listaNombre;
    const modificadoPor = notif.datos?.modificadoPor;

    // Traducir rol a español
    const rolesES: { [key: string]: string } = {
      'admin': 'Administrador',
      'editor': 'Editor',
      'colaborador': 'Colaborador',
      'lector': 'Lector'
    };

    const rolTraducido = rolesES[nuevoRol] || nuevoRol;

    const mensaje = `${modificadoPor} cambió tu rol en "${listaNombre}" a ${rolTraducido}`;

    console.log('Mostrando alerta:', mensaje);

    this.notificacionesService.exito(mensaje);
    //alert(mensaje);
  }

  // ACTUALIZADO: Toggle del chat con marcado de leídas
  toggleChat(): void {
    this.chatAbierto = !this.chatAbierto;
    console.log('Chat', this.chatAbierto ? 'abierto' : 'cerrado');

    if (this.chatAbierto) {
      // Limpiar badge INMEDIATAMENTE al abrir
      console.log('Limpiando badge al abrir chat...');
      this.mensajesNoLeidos = 0;

      // Marcar mensajes como leídos después de 1 segundo
      setTimeout(() => {
        console.log('Marcando mensajes como leídos...');

        // Marcar en la API
        this.chatService.marcarComoLeidos(this.idLista).subscribe({
          next: () => console.log('Mensajes marcados como leídos en API'),
          error: (err) => console.error('Error al marcar como leídos:', err)
        });

        // Marcar notificaciones de chat como leídas
        this.notificationService.notificaciones$.pipe(
          take(1)
        ).subscribe(notificaciones => {
          const notifsChat = notificaciones.filter(n =>
            !n.leida &&
            n.tipo === 'mensaje_chat' &&
            (n.datos?.listaId === this.idLista || n.datos?.listaId === this.idLista)
          );

          console.log(`Marcando ${notifsChat.length} notificaciones de chat como leídas`);

          notifsChat.forEach(notif => {
            this.notificationService.marcarComoLeida(notif.idNotificacion).subscribe({
              next: () => console.log(`✅ Notificación ${notif.idNotificacion} marcada como leída`),
              error: (err) => console.error(`❌ Error al marcar notificación ${notif.idNotificacion}:`, err)
            });
          });
        });
      }, 1000);
    } else {
      // ✅ Al cerrar, recargar el contador
      console.log('🔄 Recargando contador de mensajes no leídos...');
      setTimeout(() => {
        this.cargarMensajesNoLeidos();
      }, 500);
    }
  }

  // ⭐ Obtener contador para mostrar en el badge
  getMensajesNoLeidosDisplay(): string {
    console.log('getMensajesNoLeidosDisplay() llamado:', this.mensajesNoLeidos);
    if (this.mensajesNoLeidos === 0) return '';
    if (this.mensajesNoLeidos > 99) return '99+';
    return this.mensajesNoLeidos.toString();
  }

  async verificarPropietarioDirecto() {
    try {
      const lista = await this.listasService.obtenerLista(this.idLista);
      if (lista) {
        this.idCreadorLista = lista.idUsuario || 0;
        this.esPropietario = lista.idUsuario === this.idUsuarioActual;

        if (this.esPropietario) {
          this.esAdmin = true;
        }
      }
    } catch (error) {
      console.error('Error al verificar propietario:', error);
    }
  }

  puedeEditarTareas(): boolean {
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      return true;
    }

    if (!this.infoCompartidos) {
      return false;
    }

    const tuRol = this.infoCompartidos.lista?.tuRol;
    const rolesConPermiso = ['admin', 'editor', 'colaborador'];
    return rolesConPermiso.includes(tuRol || '');
  }

  puedeEliminarTareas(): boolean {
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      return true;
    }

    if (!this.infoCompartidos) {
      return false;
    }

    const tuRol = this.infoCompartidos.lista?.tuRol;
    return ['admin', 'editor'].includes(tuRol || '');
  }

  puedeAsignarTareas(): boolean {
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      return true;
    }

    if (!this.infoCompartidos) {
      return false;
    }

    const tuRol = this.infoCompartidos.lista?.tuRol;
    return tuRol === 'admin';
  }

  puedeCompartir(): boolean {
    if (this.esPropietario) return true;

    if (!this.infoCompartidos) return false;

    const tuRol = this.infoCompartidos.usuarios.find(
      u => u.idUsuario === this.idUsuarioActual
    )?.rol;

    return tuRol === 'admin';
  }

  toggleTareaCompletada(tarea: any) {
    if (!this.puedeEditarTareas()) {
      this.notificacionesService.advertencia('No tienes permisos para modificar tareas en esta lista. Tu rol es de solo lectura.');
      //alert('No tienes permisos para modificar tareas en esta lista. Tu rol es de solo lectura.');
      return;
    }

    const estadoAnterior = tarea.estado;
    const nuevoEstado = tarea.estado === 'C' ? 'P' : 'C';

    tarea.estado = nuevoEstado;

    this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado).subscribe({
      next: (response) => {
        // Éxito
      },
      error: (error) => {
        tarea.estado = estadoAnterior;

        if (error.status === 403) {
          const mensaje = error.error?.detalles || 'No tienes permisos para modificar tareas en esta lista';
          this.notificacionesService.error(mensaje);
          alert(mensaje);
        } else {
          this.notificacionesService.error('Error al actualizar el estado de la tarea')
          //alert('Error al actualizar el estado de la tarea');
        }
      }
    });
  }

  abrirModalAsignarTarea(tarea: Tarea) {
    console.log('Abriendo modal de asignación para tarea:', tarea);
    this.tareaSeleccionada = tarea;
    this.modalAsignarAbierto = true;
  }

  abrirModalAsignar() {
    console.log('Usuarios compartidos:', this.usuariosCompartidos.length);
    this.tareaSeleccionada = null;
    this.modalAsignarAbierto = true;
    console.log('Abriendo modal de asignación (sin tarea específica)');
  }

  cerrarModalAsignar() {
    this.modalAsignarAbierto = false;
    this.tareaSeleccionada = null;
  }

  async onTareaAsignada() {
    console.log('Tarea asignada/desasignada exitosamente');
    this.cerrarModalAsignar();

    if (this.columnasComponent) {
      const idLista = this.idLista;

      if (idLista) {
        await this.columnasComponent.cargarTareasDeLista(idLista);
      } else {
        await this.columnasComponent.cargarTareas();
      }
    }
  }

  abrirModalUsuarios() {
    this.modalUsuariosAbierto = true;
  }

  cerrarModalUsuarios() {
    this.modalUsuariosAbierto = false;
  }

  async hacerCompartible() {
    if (!confirm('¿Deseas hacer esta lista compartible? Podrás invitar usuarios después.')) {
      return;
    }

    const datosActualizados = {
      nombre: this.nombreLista,
      descripcion: this.descripcionLista,
      icono: this.iconoLista,
      color: this.colorLista,
      compartible: true
    };

    try {
      await this.listasService.actualizarLista(this.idLista, datosActualizados);
      this.compartible = true;
      this.notificacionesService.exito('Lista ahora es compartible. ¡Ya puedes gestionar usuarios!');
      //alert('Lista ahora es compartible. ¡Ya puedes gestionar usuarios!');
    } catch (error) {
      this.notificacionesService.error('Error al actualizar lista');
      //alert('Error al actualizar lista');
    }
  }

  onUsuariosActualizados() {
    this.cargarInfoCompartidos();
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

  async abrirPerfilUsuario(usuario: UsuarioCompartido) {
    console.log('Abriendo perfil de usuario:', usuario);

    // Mostrar datos básicos inmediatamente
    this.usuarioSeleccionado = {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: '', // Se cargará del backend
      telefono: undefined,
      cargo: undefined,
      bio: undefined,
      redesSociales: undefined,
      rol: usuario.rol,
      esCreador: usuario.esCreador
    };

    this.modalPerfilAbierto = true;

    // Cargar perfil completo del backend
    this.authService.obtenerPerfilPorId(usuario.idUsuario).subscribe({
      next: (perfilCompleto) => {
        console.log('Perfil completo obtenido:', perfilCompleto);

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
            esCreador: usuario.esCreador
          };
        }
      },
      error: (error) => {
        console.warn('No se pudo cargar perfil completo:', error);
      }
    });
  }

  // Método para mostrar todos los usuarios (modal con la lista completa)
  mostrarTodosUsuarios() {
    this.abrirModalUsuarios();
  }
  // Cerrar modal de perfil
  cerrarPerfilUsuario() {
    this.modalPerfilAbierto = false;
    this.usuarioSeleccionado = null;
  }
}