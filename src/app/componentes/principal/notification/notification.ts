import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesService, Notificacion } from '../../../core/services/notification/notification';

@Component({
  selector: 'app-notificacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrl: './notification.css'
})
export class NotificacionComponent implements OnInit {
  notificaciones: Notificacion[] = [];

  constructor(private notificacionesService: NotificacionesService) {}

  ngOnInit() {
    this.notificacionesService.obtenerNotificaciones().subscribe(notificaciones => {
      this.notificaciones = notificaciones;
    });
  }

  cerrarNotificacion(id: number) {
    this.notificacionesService.cerrar(id);
  }

  obtenerIcono(tipo: string): string {
    const iconos = {
      'exito': 'fas fa-check-circle',
      'error': 'fas fa-times-circle',
      'advertencia': 'fas fa-exclamation-triangle',
      'info': 'fas fa-info-circle'
    };
    return iconos[tipo as keyof typeof iconos] || 'fas fa-info-circle';
  }
}