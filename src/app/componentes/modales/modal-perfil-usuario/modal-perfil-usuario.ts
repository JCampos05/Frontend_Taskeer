import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-modal-perfil-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-perfil-usuario.html',
  styleUrl: './modal-perfil-usuario.css'
})
export class ModalPerfilUsuarioComponent implements OnInit {
  @Input() isOpen = false;
  @Input() usuario: PerfilUsuario | null = null;
  @Output() close = new EventEmitter<void>();

  cargandoPerfil = false;

  constructor(private notificacionesService: NotificacionesService) { }

  ngOnInit() {
    console.log('Modal perfil usuario inicializado:', this.usuario);
  }

  cerrarModal() {
    this.close.emit();
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }

  obtenerColorAvatar(nombre: string): string {
    // Generar color basado en el nombre <---- Preparacion para un futuro (quizá)
    /*const colores = [
      '#0052CC', '#6554C0', '#00875A', '#FF5630',
      '#FF8B00', '#36B37E', '#00B8D9', '#6554C0',
      '#403294', '#BF2600', '#006644', '#0747A6'
    ];
    
    if (!nombre) return colores[0];
    
    const suma = nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colores[suma % colores.length];*/
    return '#0052CC'
  }

  abrirRedSocial(url: string | undefined) {
    if (url) {
      // Asegurarse de que la URL tenga protocolo
      const urlCompleta = url.startsWith('http') ? url : `https://${url}`;
      window.open(urlCompleta, '_blank');
    }
  }

  // Método actualizado con notificación
  copiarCorreo() {
    if (this.usuario?.correo) {
      navigator.clipboard.writeText(this.usuario.correo).then(() => {
        console.log('Correo copiado al portapapeles');
        // Mostrar notificación de éxito
        this.notificacionesService.mostrar('exito','Correo copiado al portapapeles');

      }).catch((error) => {
        console.error('Error al copiar correo:', error);
        this.notificacionesService.mostrar('error', 'No se pudo copiar el correo');
      });
    }
  }

  // Método actualizado con notificación
  copiarTelefono() {
    if (this.usuario?.telefono) {
      navigator.clipboard.writeText(this.usuario.telefono).then(() => {
        console.log('Teléfono copiado al portapapeles');
        // Mostrar notificación de éxito
        this.notificacionesService.mostrar('exito','Teléfono copiado al portapapeles');
      }).catch((error) => {
        console.error('Error al copiar teléfono:', error);
        // Mostrar notificación de error
        this.notificacionesService.mostrar('error', 'No se pudo copiar el teléfono');
      });
    }
  }

  obtenerRolTraducido(rol: string | undefined): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'editor': 'Editor',
      'colaborador': 'Colaborador',
      'lector': 'Lector',
      'propietario': 'Propietario'
    };
    return roles[rol || ''] || rol || '';
  }

  obtenerIconoRol(rol: string | undefined): string {
    const iconos: { [key: string]: string } = {
      'admin': 'fa-shield-halved',
      'editor': 'fa-pen-to-square',
      'colaborador': 'fa-users',
      'lector': 'fa-eye',
      'propietario': 'fa-crown'
    };
    return iconos[rol || ''] || 'fa-user';
  }

  tieneRedesSociales(): boolean {
    if (!this.usuario?.redesSociales) return false;
    const redes = this.usuario.redesSociales;
    return !!(redes.linkedin || redes.twitter || redes.github || redes.instagram);
  }
}