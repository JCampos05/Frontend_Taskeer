import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../componentes/principal/header/header';
import { SidebarComponent } from '../../componentes/principal/sidebar/sidebar';
import { ModalCategoriaComponent } from '../../componentes/modales/modal-categoria/modal-categoria';
import { ModalListaComponent } from '../../componentes/modales/modal-lista/modal-lista';
import { NotificacionComponent } from '../../componentes/principal/notification/notification';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, 
    HeaderComponent, 
    SidebarComponent,
    ModalCategoriaComponent,
    ModalListaComponent,
    NotificacionComponent
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent {
  @ViewChild('sidebarComponent') sidebarComponent!: SidebarComponent;
  
  sidebarVisible = true;
  mostrarModalCategoria = false;
  mostrarModalLista = false;
  categoriaSeleccionadaParaLista: number | null = null;

  toggleSidebar() {
    if (this.sidebarComponent) {
      this.sidebarComponent.toggleCollapse();
    }
  }

  // ==================== MODALS CATEGORÍAS ====================
  abrirModalCategoria() {
    this.mostrarModalCategoria = true;
  }

  cerrarModalCategoria() {
    this.mostrarModalCategoria = false;
  }

  onCategoriaGuardada() {
    if (this.sidebarComponent) {
      this.sidebarComponent.cargarCategorias();
    }
  }

  // ==================== MODALS LISTAS ====================
  abrirModalLista(idCategoria: number | null) {
    this.categoriaSeleccionadaParaLista = idCategoria;
    this.mostrarModalLista = true;
  }

  cerrarModalLista() {
    this.mostrarModalLista = false;
    this.categoriaSeleccionadaParaLista = null;
  }

  onListaGuardada() {
    if (this.sidebarComponent) {
      this.sidebarComponent.cargarCategorias();
    }
  }
}