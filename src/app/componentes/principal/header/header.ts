import { Component, EventEmitter, Output, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, take } from 'rxjs'; // AGREGADO 'take'
import { AuthService, Usuario } from '../../../core/services/authentication/authentication';
import { NotificationService } from '../../../core/services/notification-user/notification-user';
import { ModalNotificacionesComponent } from '../../modales/modal-noti-user/modal-noti-user';
import { ConfiguracionComponent } from '../../../paginas/configuracion/configuracion';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, CommonModule, ModalNotificacionesComponent, ConfiguracionComponent],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  searchQuery: string = '';
  showUserMenu: boolean = false;
  showNotificaciones: boolean = false;
  showModalIntegracion: boolean = false;
  cantidadNoLeidas: number = 0;
  mostrarConfiguracion = false;


  // ✅ NUEVO: Subscripciones
  private subscriptions: Subscription[] = [];

  usuario: {
    nombre: string;
    email: string;
    iniciales: string;
  } = {
      nombre: 'Usuario',
      email: 'usuario@ejemplo.com',
      iniciales: 'U'
    };

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();

    this.authService.usuarioActual$.subscribe(usuario => {
      if (usuario) {
        this.actualizarDatosUsuario(usuario);
      }
    });

    // ✅ CRÍTICO: Escuchar cambios en notificaciones no leídas
    const notifSub = this.notificationService.cantidadNoLeidas$.subscribe(cantidad => {
      console.log('🔔 Header: Cantidad no leídas actualizada:', cantidad);
      this.cantidadNoLeidas = cantidad;
    });

    this.subscriptions.push(notifSub);

    // ✅ MEJORADO: También escuchar todas las notificaciones para sincronización
    const allNotifSub = this.notificationService.notificaciones$.subscribe(notificaciones => {
      const noLeidas = notificaciones.filter(n => !n.leida).length;
      console.log('📋 Header: Total notificaciones:', notificaciones.length);
      console.log('📋 Header: No leídas calculadas:', noLeidas);

      // ✅ SINCRONIZAR si hay diferencia
      if (noLeidas !== this.cantidadNoLeidas) {
        console.log('⚠️ Sincronizando contador:', this.cantidadNoLeidas, '->', noLeidas);
        this.cantidadNoLeidas = noLeidas;
      }
    });

    this.subscriptions.push(allNotifSub);

    // ✅ NUEVO: Forzar actualización inicial después de 1 segundo
    setTimeout(() => {
      this.notificationService.notificaciones$.pipe(take(1)).subscribe(notificaciones => {
        const noLeidas = notificaciones.filter(n => !n.leida).length;
        if (this.cantidadNoLeidas !== noLeidas) {
          console.log('🔄 Sincronización inicial forzada:', noLeidas);
          this.cantidadNoLeidas = noLeidas;
        }
      });
    }, 1000);
  }

  ngOnDestroy() {
    // ✅ Limpiar subscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private cargarDatosUsuario() {
    const usuarioActual = this.authService.obtenerUsuarioActual();
    if (usuarioActual) {
      this.actualizarDatosUsuario(usuarioActual);
    }
  }

  private actualizarDatosUsuario(usuario: Usuario) {
    this.usuario = {
      nombre: usuario.nombre,
      email: usuario.email,
      iniciales: this.obtenerIniciales(usuario.nombre)
    };
  }

  private obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';

    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/app/buscar'], {
        queryParams: { q: this.searchQuery }
      });
    }
  }

  cambiarVista() {
    console.log('Función pendiente: cambiar vista de día');
  }

  loginGoogle() {
    console.log('Login con Google');
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotificaciones = false;
    }
  }

  toggleNotificaciones() {
    this.showNotificaciones = !this.showNotificaciones;
    if (this.showNotificaciones) {
      this.showUserMenu = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile') && !target.closest('.user-menu')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.btn-notificaciones') && !target.closest('.modal-notificaciones')) {
      this.showNotificaciones = false;
    }
  }

  verPerfil() {
    console.log('Ver perfil');
    this.showUserMenu = false;
    this.router.navigate(['/app/mi-perfil']);
  }

  verConfiguracion() {
    console.log('Ver configuración');
    this.showUserMenu = false;
    this.mostrarConfiguracion = true; // En lugar de navegar
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
  }

  cerrarConfiguracion() {
    this.mostrarConfiguracion = false;
    // Restaurar scroll
    document.body.style.overflow = 'auto';
  }

  verIntegracion() {
    console.log('Ver integración');
    this.showUserMenu = false;
    this.showModalIntegracion = true; // NUEVO
  }

  cerrarModalIntegracion() {
    this.showModalIntegracion = false;
  }

  cerrarSesion() {
    console.log('Cerrando sesión...');
    this.showUserMenu = false;
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}