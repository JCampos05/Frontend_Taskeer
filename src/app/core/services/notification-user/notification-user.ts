import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from '../authentication/authentication';

export interface Notificacion {
  idNotificacion: number;
  idUsuario: number;
  tipo: 'invitacion_lista' | 'tarea_asignada' | 'comentario' | 'tarea_repetir' | 'recordatorio' | 'mensaje_chat' | 'cambio_rol_lista' | 'otro';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  datos?: {
    listaId?: number;
    listaNombre?: string;
    invitadoPor?: string;
    invitadoPorId?: number;
    rol?: string;
    tareaId?: number;
    tareaNombre?: string;
    fechaVencimiento?: string;
    asignadoPor?: string;
    idMensaje?: number;
    nombreRemitente?: string;
    nuevoRol?: string;
    rolAnterior?: string;
    modificadoPor?: string;
    modificadoPorId?: number;
    revocadoPor?: string;
    revocadoPorId?: number;
  };
}

interface NotificacionesResponse {
  notificaciones: Notificacion[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/api/compartir/notificaciones';
  private sseUrl = 'http://localhost:3000/api/sse/notificaciones';

  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  private cantidadNoLeidasSubject = new BehaviorSubject<number>(0);
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any;

  private notificacionesOcultas = new Set<number>();
  private readonly STORAGE_KEY = 'notificaciones_ocultas';

  public notificaciones$ = this.notificacionesSubject.asObservable();
  public cantidadNoLeidas$ = this.cantidadNoLeidasSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.cargarNotificacionesOcultas();
    this.inicializarConToken();
  }

  private inicializarConToken(): void {
    // ✅ FIX: Usar el mismo nombre de token que AuthService
    const token = localStorage.getItem('auth_token');

    if (token) {
      console.log('✅ Token encontrado, conectando SSE...');
      this.conectarSSE();
      this.cargarNotificaciones();
    } else {
      console.log('⏳ Esperando token para conectar SSE...');

      let intentos = 0;
      const checkInterval = setInterval(() => {
        const tokenActual = localStorage.getItem('auth_token'); // ✅ FIX
        intentos++;

        if (tokenActual) {
          console.log('✅ Token encontrado en intento', intentos);
          clearInterval(checkInterval);
          this.conectarSSE();
          this.cargarNotificaciones();
        } else if (intentos >= 10) {
          console.warn('⚠️ No se encontró token después de 10 intentos');
          clearInterval(checkInterval);
        }
      }, 1000);
    }
  }

  public reconectar(): void {
    console.log('🔄 Forzando reconexión SSE...');
    this.desconectarSSE();
    this.conectarSSE();
    this.cargarNotificaciones();
  }

  private cargarNotificacionesOcultas() {
    try {
      const ocultas = localStorage.getItem(this.STORAGE_KEY);
      if (ocultas) {
        const ids = JSON.parse(ocultas);
        this.notificacionesOcultas = new Set(ids);
        console.log('📋 Notificaciones ocultas cargadas:', this.notificacionesOcultas.size);
      }
    } catch (error) {
      console.error('❌ Error al cargar notificaciones ocultas:', error);
    }
  }

  private guardarNotificacionesOcultas() {
    try {
      const ids = Array.from(this.notificacionesOcultas);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
      console.log('💾 Notificaciones ocultas guardadas:', ids.length);
    } catch (error) {
      console.error('❌ Error al guardar notificaciones ocultas:', error);
    }
  }

  ocultarNotificacion(idNotificacion: number) {
    this.notificacionesOcultas.add(idNotificacion);
    this.guardarNotificacionesOcultas();

    const notificacionesActuales = this.notificacionesSubject.value;
    const notificacionesFiltradas = notificacionesActuales.filter(
      n => n.idNotificacion !== idNotificacion
    );
    this.notificacionesSubject.next(notificacionesFiltradas);
    this.actualizarContador();
  }

  restaurarNotificacionesOcultas() {
    this.notificacionesOcultas.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    this.cargarNotificaciones();
  }

  private actualizarContador(): void {
    const notificaciones = this.notificacionesSubject.value;
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    this.cantidadNoLeidasSubject.next(noLeidas);
    console.log('🔢 Contador actualizado:', noLeidas);
  }

  private agregarNotificacion(notificacion: Notificacion): void {
    if (this.notificacionesOcultas.has(notificacion.idNotificacion)) {
      console.log('🚫 Notificación oculta, no se agrega:', notificacion.idNotificacion);
      return;
    }

    const notificaciones = this.notificacionesSubject.value;

    if (notificaciones.find(n => n.idNotificacion === notificacion.idNotificacion)) {
      console.log('⚠️ Notificación duplicada, ignorando:', notificacion.idNotificacion);
      return;
    }

    this.notificacionesSubject.next([notificacion, ...notificaciones]);
    this.actualizarContador();
  }

  private marcarNotificacionComoLeida(idNotificacion: number): void {
    const notificaciones = this.notificacionesSubject.value.map(n =>
      n.idNotificacion === idNotificacion ? { ...n, leida: true } : n
    );

    this.notificacionesSubject.next(notificaciones);
    this.actualizarCantidadNoLeidas(notificaciones);
  }

  cargarNotificaciones(): void {
    this.http.get<NotificacionesResponse>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('❌ Error al cargar notificaciones:', error);
          return of({ notificaciones: [] });
        })
      )
      .subscribe({
        next: (response) => {
          console.log('📨 Notificaciones cargadas desde API:', response.notificaciones?.length || 0);

          const notificaciones = (response.notificaciones || []).map((n: any) => ({
            ...n,
            leida: Boolean(n.leida === 1 || n.leida === true)
          }));

          const notificacionesVisibles = notificaciones.filter(
            n => !this.notificacionesOcultas.has(n.idNotificacion)
          );

          console.log('👁️ Notificaciones visibles:', notificacionesVisibles.length);
          console.log('🚫 Notificaciones ocultas:', this.notificacionesOcultas.size);

          this.notificacionesSubject.next(notificacionesVisibles);
          this.actualizarContador();
        }
      });
  }

  private actualizarCantidadNoLeidas(notificaciones: Notificacion[]): void {
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    this.cantidadNoLeidasSubject.next(noLeidas);
  }

  marcarComoLeida(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/leer`, {}).pipe(
      tap(() => this.marcarNotificacionComoLeida(id))
    );
  }

  aceptarInvitacion(notificacionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${notificacionId}/aceptar`, {}).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }

  rechazarInvitacion(notificacionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${notificacionId}/rechazar`, {}).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }

  marcarTodasComoLeidas(): Observable<any> {
    return this.http.put(`${this.apiUrl}/leer-todas`, {}).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }

  crearNotificacionRepeticion(tareaId: number, tareaNombre: string, fechaVencimiento: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear-repeticion`, {
      tareaId,
      tareaNombre,
      fechaVencimiento
    });
  }

  programarRecordatorio(tareaId: number, tareaNombre: string, fechaRecordatorio: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/programar-recordatorio`, {
      tareaId,
      tareaNombre,
      fechaRecordatorio
    });
  }

  // ========== SECCIÓN SSE ==========

  private conectarSSE(): void {
    // ✅ FIX: Usar el token correcto
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.error('❌ No se encontró token para SSE');
      this.programarReconexion(3000);
      return;
    }

    if (this.eventSource) {
      console.log('🔌 Cerrando conexión SSE anterior...');
      this.eventSource.close();
    }

    const url = `${this.sseUrl}?token=${token}`;
    console.log('🔌 Conectando a SSE:', this.sseUrl);

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('✅ Conexión SSE establecida');
      this.reconnectAttempts = 0;
    };

    this.eventSource.addEventListener('nueva_notificacion', this.manejarNuevaNotificacion.bind(this));
    this.eventSource.addEventListener('notificacion_leida', this.manejarNotificacionLeida.bind(this));

    this.eventSource.onerror = (error) => {
      console.error('❌ Error en SSE:', error);
      this.desconectarSSE();
      this.programarReconexion();
    };
  }

  private manejarNuevaNotificacion(event: MessageEvent): void {
    console.log('📨 SSE: Nueva notificación recibida');
    console.log('📦 Raw data:', event.data);

    try {
      const data = JSON.parse(event.data);

      // ✅ FILTRAR EVENTOS DE SISTEMA (no son notificaciones reales)
      if (data.type === 'connected' || data.event === 'connected') {
        console.log('ℹ️ Evento de conexión SSE, ignorando');
        return;
      }

      // ✅ Validar que tenga tipo de notificación válido
      const tiposValidos = [
        'invitacion_lista',
        'tarea_asignada',
        'comentario',
        'tarea_repetir',
        'recordatorio',
        'mensaje_chat',
        'cambio_rol_lista',
        'otro'
      ];

      if (!data.tipo || !tiposValidos.includes(data.tipo)) {
        console.warn('⚠️ Tipo de notificación inválido:', data.tipo);
        return;
      }

      // ✅ Validar que tenga ID
      const id = data.idNotificacion || data.id;

      if (!id || id === undefined) {
        console.error('❌ Notificación sin ID válido:', data);
        return;
      }

      // ... resto del código igual
      const notificacion: Notificacion = {
        idNotificacion: parseInt(id),
        idUsuario: parseInt(data.idUsuario),
        tipo: data.tipo,
        titulo: data.titulo || 'Sin título',
        mensaje: data.mensaje || '',
        leida: Boolean(data.leida),
        fechaCreacion: data.fechaCreacion || new Date().toISOString(),
        datos: data.datos || {}
      };

      console.log('✅ Notificación normalizada:', {
        id: notificacion.idNotificacion,
        tipo: notificacion.tipo,
        titulo: notificacion.titulo.substring(0, 30)
      });

      // ... resto del código igual
      const notificacionesActuales = this.notificacionesSubject.value;
      const existe = notificacionesActuales.some(n =>
        n.idNotificacion === notificacion.idNotificacion
      );

      if (existe) {
        console.log('⚠️ Notificación duplicada, ignorando:', notificacion.idNotificacion);
        return;
      }

      if (this.notificacionesOcultas.has(notificacion.idNotificacion)) {
        console.log('🚫 Notificación oculta, no se agrega:', notificacion.idNotificacion);
        return;
      }

      this.notificacionesSubject.next([notificacion, ...notificacionesActuales]);

      if (!notificacion.leida) {
        const contadorActual = this.cantidadNoLeidasSubject.value;
        this.cantidadNoLeidasSubject.next(contadorActual + 1);
        console.log(' Contador actualizado:', contadorActual + 1);
      }

      console.log(' Notificación agregada correctamente');
    } catch (error) {
      console.error(' Error al procesar notificación SSE:', error);
    }
  }

  private manejarNotificacionLeida(event: MessageEvent): void {
    console.log('✅ SSE: Notificación marcada como leída');

    try {
      const data = JSON.parse(event.data);
      const idNotificacion = data.idNotificacion || data.id;

      const notificacionesActuales = this.notificacionesSubject.value;
      const notificacionesActualizadas = notificacionesActuales.map(n =>
        n.idNotificacion === idNotificacion ? { ...n, leida: true } : n
      );

      this.notificacionesSubject.next(notificacionesActualizadas);

      const noLeidas = notificacionesActualizadas.filter(n => !n.leida).length;
      this.cantidadNoLeidasSubject.next(noLeidas);

      console.log('✅ Notificación marcada como leída localmente');
    } catch (error) {
      console.error('❌ Error al procesar notificación leída:', error);
    }
  }

  private programarReconexion(delay?: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    const backoffDelay = delay || Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`🔄 Reconexión SSE programada en ${backoffDelay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.conectarSSE();
    }, backoffDelay);
  }

  obtenerMensajesNoLeidosLista(idLista: number): Observable<number> {
    return this.notificaciones$.pipe(
      map((notificaciones: Notificacion[]) => {
        const mensajesChat = notificaciones.filter((n: Notificacion) =>
          !n.leida &&
          n.tipo === 'mensaje_chat' &&
          (n.datos?.listaId === idLista || n.datos?.listaId === idLista)
        );
        return mensajesChat.length;
      })
    );
  }

  private desconectarSSE(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 SSE desconectado');
    }
  }
}