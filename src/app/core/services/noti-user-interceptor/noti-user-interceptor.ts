import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, Notificacion } from '../notification-user/notification-user';
import { NotificacionesService } from '../notification/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationInterceptorService {
  private procesadasIds = new Set<number>();

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private notificacionesService: NotificacionesService
  ) {
    this.iniciarEscucha();
  }

  private iniciarEscucha(): void {
    this.notificationService.notificaciones$.subscribe(notificaciones => {
      // Procesar solo notificaciones nuevas no leídas
      const nuevas = notificaciones.filter(n =>
        !n.leida && !this.procesadasIds.has(n.idNotificacion)
      );

      nuevas.forEach(notif => {
        this.procesarNotificacion(notif);
        this.procesadasIds.add(notif.idNotificacion);
      });
    });
  }

  private procesarNotificacion(notif: Notificacion): void {
    console.log(' Procesando notificación global:', notif);

    switch (notif.tipo) {
      case 'cambio_rol_lista':
        this.manejarCambioRol(notif);
        break;

      case 'invitacion_lista':
        this.manejarInvitacion(notif);
        break;

      case 'tarea_asignada':
        this.manejarTareaAsignada(notif);
        break;

      case 'mensaje_chat':
        this.manejarMensajeChat(notif);
        break;

      case 'recordatorio':
        this.manejarRecordatorio(notif);
        break;

      case 'otro':
        if (notif.datos?.revocadoPor) {
          this.manejarRevocacion(notif);
        }
        break;
    }
  }

  private manejarRecordatorio(notif: Notificacion): void {
    const tareaNombre = notif.datos?.tareaNombre;
    const fechaVencimiento = notif.datos?.fechaVencimiento;
    const tareaId = notif.datos?.tareaId;
    const listaId = notif.datos?.listaId;

    let mensaje = `"${tareaNombre}"`;  // ← Quité "Recordatorio:"

    if (fechaVencimiento) {
      const fecha = new Date(fechaVencimiento);
      mensaje += ` - Vence: ${fecha.toLocaleDateString('es-MX')}`;
    }

    this.mostrarNotificacionVisual(
      'Recordatorio de tarea',
      mensaje,
      () => {
        if (listaId) {
          this.router.navigate(['/app/lista', listaId]);
        } else {
          this.router.navigate(['/app/mi-dia']);
        }
      },
      true
    );
  }


  private manejarMensajeChat(notif: Notificacion): void {
    const listaNombre = notif.datos?.listaNombre;
    const nombreRemitente = notif.datos?.nombreRemitente;
    const listaId = notif.datos?.listaId;

    console.log('Mensaje de chat recibido:', { listaNombre, nombreRemitente, listaId });

    this.mostrarNotificacionVisual(
      'Nuevo mensaje',
      `${nombreRemitente} escribió en "${listaNombre}"`,
      () => {
        if (listaId) {
          this.router.navigate(['/app/lista', listaId]);
        }
      }
    );
  }


  private manejarCambioRol(notif: Notificacion): void {
    const listaId = notif.datos?.listaId || notif.datos?.listaId;
    const nuevoRol = notif.datos?.nuevoRol;
    const rolAnterior = notif.datos?.rolAnterior;
    const listaNombre = notif.datos?.listaNombre;
    const modificadoPor = notif.datos?.modificadoPor;

    console.log('🔄 Cambio de rol detectado:', {
      listaId,
      nuevoRol,
      rolAnterior,
      listaNombre,
      modificadoPor
    });

    // ✅ Determinar emoji según el nuevo rol
    //const emojiRol = this.obtenerEmojiRol(nuevoRol);

    // ✅ Mostrar notificación visual del navegador
    this.mostrarNotificacionVisual(
      //`${emojiRol} Cambio de permisos`,
      `Cambio de permisos`,
      `${modificadoPor} cambió tu rol en "${listaNombre}" de ${rolAnterior} a ${nuevoRol}`,
      () => {
        if (listaId) {
          this.router.navigate(['/app/lista', listaId]);
        }
      }
    );

    // ✅ Reproducir sonido diferente para cambio de rol
    //this.reproducirSonidoNotificacion(900); // Tono más alto

    // ✅ Si el usuario está viendo esa lista, recargar permisos
    const currentUrl = this.router.url;
    if (currentUrl.includes(`/app/lista/${listaId}`)) {
      console.log('🔄 Usuario está en la lista, recargando página para actualizar permisos...');

      // Esperar 2 segundos para que el usuario vea la notificación
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  private manejarInvitacion(notif: Notificacion): void {
    const listaNombre = notif.datos?.listaNombre;
    const invitadoPor = notif.datos?.invitadoPor;

    this.mostrarNotificacionVisual(
      'Nueva invitación',
      `${invitadoPor} te invitó a "${listaNombre}"`,
      () => {
        // Navegar a listas compartidas
        this.router.navigate(['/app/listas']);
      }
    );
  }

  private manejarTareaAsignada(notif: Notificacion): void {
    const tareaNombre = notif.datos?.tareaNombre;
    const listaNombre = notif.datos?.listaNombre;
    const listaId = notif.datos?.listaId;

    this.mostrarNotificacionVisual(
      'Tarea asignada',
      `Nueva tarea: "${tareaNombre}" en ${listaNombre}`,
      () => {
        if (listaId) {
          this.router.navigate(['/app/lista', listaId]);
        }
      }
    );

    //this.reproducirSonidoNotificacion();
  }

  /*
  private reproducirSonidoNotificacion(): void {
    try {
      // Crear audio con un tono de notificación
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
  
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
  
      // Configurar tono agradable
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
  
      // Volumen suave
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
      // Reproducir
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('⚠️ No se pudo reproducir sonido:', error);
    }
  }*/



  private manejarRevocacion(notif: Notificacion): void {
    const listaNombre = notif.datos?.listaNombre;
    const revocadoPor = notif.datos?.revocadoPor;
    const listaId = notif.datos?.listaId;

    this.mostrarNotificacionVisual(
      'Acceso revocado',
      `${revocadoPor} revocó tu acceso a "${listaNombre}"`,
      () => {
        // Redirigir a home
        this.router.navigate(['/app/mi-dia']);
      },
      true // Es crítico
    );

    // Si estamos en esa lista, redirigir inmediatamente
    const currentUrl = this.router.url;
    if (currentUrl.includes(`/app/lista/${listaId}`)) {
      setTimeout(() => {
        this.router.navigate(['/app/mi-dia']);
      }, 2000);
    }
  }

  private mostrarNotificacionVisual(
    titulo: string,
    mensaje: string,
    onClick?: () => void,
    critico: boolean = false
  ): void {
    // Determinar el tipo de notificación según si es crítico
    const tipo = critico ? 'advertencia' : 'info';

    // Mostrar usando tu componente de notificación
    this.notificacionesService.mostrar(
      tipo,
      `${titulo}: ${mensaje}`,
      critico ? 5000 : 3000
    );

    // Si hay una acción al hacer clic y es crítico, ejecutarla automáticamente
    if (onClick && critico) {
      setTimeout(() => {
        onClick();
      }, 2000);
    }
  }

  // Solicitar permisos de notificación al iniciar
  public solicitarPermisos(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log(' Permisos de notificación:', permission);
      });
    }
  }
}