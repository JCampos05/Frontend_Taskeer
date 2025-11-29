import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notificacion {
  id: number;
  tipo: 'exito' | 'error' | 'advertencia' | 'info';
  mensaje: string;
  duracion?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private notificaciones$ = new BehaviorSubject<Notificacion[]>([]);
  private idContador = 0;

  obtenerNotificaciones() {
    return this.notificaciones$.asObservable();
  }

  mostrar(tipo: 'exito' | 'error' | 'advertencia' | 'info', mensaje: string, duracion: number = 3000) {
    const notificacion: Notificacion = {
      id: ++this.idContador,
      tipo,
      mensaje,
      duracion
    };

    const notificacionesActuales = this.notificaciones$.value;
    this.notificaciones$.next([...notificacionesActuales, notificacion]);

    if (duracion > 0) {
      setTimeout(() => {
        this.cerrar(notificacion.id);
      }, duracion);                                                                                                    
    }
  }

  exito(mensaje: string, duracion: number = 3000) {
    this.mostrar('exito', mensaje, duracion);
  }

  error(mensaje: string, duracion: number = 4000) {
    this.mostrar('error', mensaje, duracion);
  }

  advertencia(mensaje: string, duracion: number = 3500) {
    this.mostrar('advertencia', mensaje, duracion);
  }

  info(mensaje: string, duracion: number = 3000) {
    this.mostrar('info', mensaje, duracion);
  }

  cerrar(id: number) {
    const notificacionesActuales = this.notificaciones$.value;
    this.notificaciones$.next(notificacionesActuales.filter(n => n.id !== id));
  }
}