import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompartirService, UsuarioCompartido, InfoCompartidos } from '../../../core/services/compartir/compartir';
import { NotificacionesService } from '../../../core/services/notification/notification';

@Component({
  selector: 'app-modal-usuarios-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-usuarios-lista.html',
  styleUrls: ['./modal-usuarios-lista.css']
})
export class ModalUsuariosListaComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() listaId: number = 0;
  @Input() esPropietario = false;
  @Input() esAdmin = false;
  @Output() close = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();

  infoCompartidos: InfoCompartidos | null = null;
  emailInvitar = '';
  rolInvitar = 'colaborador';
  loadingInvitar = false;
  copiado = false;

  // ✅ Mantener una copia temporal de los roles antes de confirmar cambios
  private rolesTemporales = new Map<number, string>();

  constructor(
    private compartirService: CompartirService,
    private notificacionesService: NotificacionesService,
  ) {}

  ngOnInit() {
    if (this.isOpen && this.listaId) {
      this.cargarUsuarios();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen && this.listaId) {
      this.cargarUsuarios();
    }
  }

  cargarUsuarios() {
    this.compartirService.obtenerInfoCompartidosLista(this.listaId).subscribe({
      next: (info) => {
        this.infoCompartidos = info;
        // Limpiar roles temporales al cargar
        this.rolesTemporales.clear();
        console.log('✅ Info compartidos cargada:', info);
      },
      error: (error) => {
        console.error(' Error al cargar usuarios:', error);
        this.notificacionesService.mostrar('error','Error al cargar usuarios');
        //alert('Error al cargar usuarios');
      }
    });
  }

  invitarUsuario() {
    if (!this.emailInvitar || !this.emailInvitar.includes('@')) {
      this.notificacionesService.mostrar('advertencia', 'Por favor ingresa un email válido');
      //alert('Por favor ingresa un email válido');
      return;
    }

    this.loadingInvitar = true;

    console.log(' Enviando invitación con rol:', this.rolInvitar);

    this.compartirService.invitarUsuarioLista(this.listaId, this.emailInvitar, this.rolInvitar).subscribe({
      next: (response) => {
        console.log('✅ Usuario invitado:', response);
        this.notificacionesService.mostrar('exito',`Invitación enviada a ${this.emailInvitar}`)
        //alert(`Invitación enviada a ${this.emailInvitar}`);
        this.emailInvitar = '';
        this.cargarUsuarios();
        this.actualizado.emit();
        this.loadingInvitar = false;
      },
      error: (error) => {
        console.error('❌ Error al invitar:', error);
        this.notificacionesService.mostrar('exito',error.error?.error || 'Error al enviar invitación')
        //alert(error.error?.error || 'Error al enviar invitación');
        this.loadingInvitar = false;
      }
    });
  }

  // Método que se ejecuta cuando cambia el dropdown
  onRolChange(usuario: UsuarioCompartido, nuevoRol: string) {
    console.log('🔄 Rol cambiado para', usuario.nombre, ':', nuevoRol);
    
    // Guardar temporalmente el cambio
    this.rolesTemporales.set(usuario.idUsuario, nuevoRol);
    
    // Aplicar el cambio inmediatamente
    this.cambiarRolEnServidor(usuario, nuevoRol);
  }

  // ✅ Método renombrado para evitar confusión
  private cambiarRolEnServidor(usuario: UsuarioCompartido, nuevoRol: string) {
    const rolAnterior = usuario.rol;
    
    console.log('🔄 Cambiando rol de', usuario.nombre, 'de', rolAnterior, 'a', nuevoRol);

    this.compartirService.modificarRolLista(this.listaId, usuario.idUsuario, nuevoRol).subscribe({
      next: () => {
        console.log('✅ Rol actualizado exitosamente');
        // Recargar para asegurar consistencia con el servidor
        this.cargarUsuarios();
        this.actualizado.emit();
      },
      error: (error) => {
        console.error('❌ Error al cambiar rol:', error);
        
        // ✅ Revertir el cambio local si falla
        usuario.rol = rolAnterior;
        
        // Mostrar error específico
        const mensajeError = error.error?.error || error.error?.detalles || 'Error al cambiar el rol';
        this.notificacionesService.mostrar('exito',`Error: ${mensajeError}`)
        //alert(`Error: ${mensajeError}`);
        // Recargar desde el servidor
        this.cargarUsuarios();
      }
    });
  }

  revocarAcceso(usuario: UsuarioCompartido) {
    if (!confirm(`¿Seguro que deseas revocar el acceso de ${usuario.nombre}?`)) {
      return;
    }

    this.compartirService.revocarAccesoLista(this.listaId, usuario.idUsuario).subscribe({
      next: () => {
        console.log('✅ Acceso revocado');
        this.notificacionesService.mostrar('info',`Acceso revocado para ${usuario.nombre}` );
        //alert(`Acceso revocado para ${usuario.nombre}`);
        this.cargarUsuarios();
        this.actualizado.emit();
      },
      error: (error) => {
        console.error('❌ Error al revocar:', error);
        this.notificacionesService.mostrar('error','Error al revocar acceso' );
        //alert('Error al revocar acceso');
      }
    });
  }

  copiarClave() {
    const clave = this.infoCompartidos?.lista?.claveCompartir;
    if (!clave) return;

    navigator.clipboard.writeText(clave).then(() => {
      this.copiado = true;
      setTimeout(() => this.copiado = false, 2000);
    });
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }

  // ✅ Método helper para traducir roles a español
  traducirRol(rol: string): string {
    const traducciones: {[key: string]: string} = {
      'admin': 'Administrador',
      'colaborador': 'Colaborador',
      'lector': 'Lector',
      'editor': 'Editor',
      'visor': 'Lector' // Por si acaso viene de BD
    };
    return traducciones[rol] || rol;
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

  cerrar() {
    this.close.emit();
  }
}