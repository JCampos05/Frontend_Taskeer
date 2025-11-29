// src/app/core/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Mensaje, UsuarioOnline } from '../sockets/sockets';

// ========== INTERFACES ADICIONALES ==========
export interface MensajeNoLeido {
  idLista: number;
  nombreLista: string;
  mensajesNoLeidos: number;
}

export interface EstadisticasChat {
  totalMensajes: number;
  usuariosActivos: number;
  mensajesUltimas24h: number;
  mensajesUltimaSemana?: number;
  primerMensaje?: Date | string;
  ultimoMensaje?: Date | string;
  usuariosOnline: number;
  usuariosEscribiendo: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    limite: number;
    offset: number;
    total: number;
  };
}

// ========== SERVICIO ==========
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // ⭐ URL del backend - MODIFICA SEGÚN TU CONFIGURACIÓN
  private readonly API_URL = 'http://localhost:3000/api/chat';

  constructor(private http: HttpClient) {}

  /**
   * Obtener historial de mensajes de una lista
   */
  obtenerHistorial(
    idLista: number, 
    limite: number = 50, 
    offset: number = 0
  ): Observable<Mensaje[]> {
    const params = new HttpParams()
      .set('limite', limite.toString())
      .set('offset', offset.toString());

    return this.http
      .get<ApiResponse<Mensaje[]>>(`${this.API_URL}/lista/${idLista}/mensajes`, { params })
      .pipe(
        map(response => {
          // Convertir fechas de string a Date
          return response.data.map(mensaje => ({
            ...mensaje,
            fechaCreacion: new Date(mensaje.fechaCreacion),
            fechaEdicion: mensaje.fechaEdicion ? new Date(mensaje.fechaEdicion) : null
          }));
        })
      );
  }

  /**
   * Obtener mensajes no leídos del usuario
   */
  obtenerNoLeidos(idLista?: number): Observable<MensajeNoLeido[]> {
    let params = new HttpParams();
    if (idLista) {
      params = params.set('idLista', idLista.toString());
    }

    return this.http
      .get<ApiResponse<MensajeNoLeido[]>>(`${this.API_URL}/mensajes/no-leidos`, { params })
      .pipe(map(response => response.data));
  }

  /**
   * Marcar todos los mensajes de una lista como leídos
   */
  marcarComoLeidos(idLista: number): Observable<{ mensajesMarcados: number }> {
    return this.http
      .post<ApiResponse<{ mensajesMarcados: number }>>(
        `${this.API_URL}/lista/${idLista}/marcar-leidos`,
        {}
      )
      .pipe(map(response => response.data));
  }

  /**
   * Obtener estadísticas del chat de una lista
   */
  obtenerEstadisticas(idLista: number): Observable<EstadisticasChat> {
    return this.http
      .get<ApiResponse<EstadisticasChat>>(`${this.API_URL}/lista/${idLista}/estadisticas`)
      .pipe(
        map(response => {
          const data = response.data;
          return {
            ...data,
            primerMensaje: data.primerMensaje ? new Date(data.primerMensaje) : undefined,
            ultimoMensaje: data.ultimoMensaje ? new Date(data.ultimoMensaje) : undefined
          };
        })
      );
  }

  /**
   * Editar un mensaje
   */
  editarMensaje(idMensaje: number, contenido: string): Observable<Mensaje> {
    return this.http
      .put<ApiResponse<Mensaje>>(`${this.API_URL}/mensaje/${idMensaje}`, { contenido })
      .pipe(
        map(response => ({
          ...response.data,
          fechaCreacion: new Date(response.data.fechaCreacion),
          fechaEdicion: response.data.fechaEdicion ? new Date(response.data.fechaEdicion) : null
        }))
      );
  }

  /**
   * Eliminar un mensaje
   */
  eliminarMensaje(idMensaje: number): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(`${this.API_URL}/mensaje/${idMensaje}`);
  }

  /**
   * Obtener usuarios online en una lista
   */
  obtenerUsuariosOnline(idLista: number): Observable<UsuarioOnline[]> {
    return this.http
      .get<ApiResponse<UsuarioOnline[]>>(`${this.API_URL}/lista/${idLista}/usuarios-online`)
      .pipe(map(response => response.data));
  }
}