import { Component, ViewEncapsulation, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GeneralComponent } from './general/general';
import { RedesSocialesComponent } from './redes-sociales/redes-sociales';
import { SeguridadComponent } from './seguridad/seguridad';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, GeneralComponent, RedesSocialesComponent, SeguridadComponent],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
  encapsulation: ViewEncapsulation.None
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  // ✅ Output para cuando se usa como modal
  @Output() cerrarModal = new EventEmitter<void>();
  
  seccionActiva: 'general' | 'redes' | 'seguridad' = 'general';
  private escListener: ((event: KeyboardEvent) => void) | null = null;
  private esRuta: boolean = false; // ✅ Detectar si se abrió como ruta

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    console.log('🎯 Configuración inicializada');
    
    // ✅ Detectar si se abrió como ruta o como modal
    this.esRuta = this.router.url.includes('/configuracion');
    console.log('📍 Abierto como:', this.esRuta ? 'RUTA' : 'MODAL');
    
    // ✅ Configurar listener de ESC
    this.escListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        console.log('⌨️ ESC presionado - Cerrando modal');
        event.preventDefault();
        event.stopPropagation();
        this.cerrar();
      }
    };
    
    document.addEventListener('keydown', this.escListener, true);
  }

  ngOnDestroy() {
    console.log('💀 Configuración destruyéndose');
    
    // ✅ Limpiar listener
    if (this.escListener) {
      document.removeEventListener('keydown', this.escListener, true);
      this.escListener = null;
      console.log('🧹 Listener de ESC removido');
    }
  }

  cambiarSeccion(seccion: 'general' | 'redes' | 'seguridad') {
    console.log('🔄 Cambiando a sección:', seccion);
    this.seccionActiva = seccion;
  }

  cerrar() {
    console.log('🚪 Cerrando configuración...');
    
    // ✅ Remover listener ANTES de cerrar
    if (this.escListener) {
      document.removeEventListener('keydown', this.escListener, true);
      this.escListener = null;
    }
    
    // ✅ DECISIÓN: ¿Cómo se abrió?
    if (this.esRuta) {
      // Se abrió como RUTA → Navegar de regreso
      console.log('🔙 Cerrando vía navegación (era ruta)');
      this.router.navigate(['/app/mi-dia']);
    } else {
      // Se abrió como MODAL → Emitir evento
      console.log('📤 Cerrando vía Output (era modal)');
      this.cerrarModal.emit();
    }
  }

  cerrarSiEsOverlay(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Verificar que el click fue EN el overlay mismo
    if (target.classList.contains('configuracion-overlay')) {
      console.log('✅ Click en overlay - Cerrando');
      event.preventDefault();
      event.stopPropagation();
      this.cerrar();
    }
  }
}