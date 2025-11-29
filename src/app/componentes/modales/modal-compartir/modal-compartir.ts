import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompartirService } from '../../../core/services/compartir/compartir';

@Component({
  selector: 'app-modal-compartir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-compartir.html',
  styleUrls: ['./modal-compartir.css']
})
export class ModalCompartirComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() tipo: 'categoria' | 'lista' = 'categoria';
  @Input() itemId: number = 0;
  @Input() itemNombre: string = '';
  @Input() claveExistente: string | null = null;
  @Output() close = new EventEmitter<void>();
  // ✅ ACTUALIZADO: Emitir objeto completo con información de listas compartidas
  @Output() compartido = new EventEmitter<any>();

  claveGenerada: string = '';
  urlCompartir: string = '';
  loading = false;
  copiado = false;
  
  // ✅ NUEVO: Información adicional para categorías
  listasCompartidas: number = 0;

  constructor(private compartirService: CompartirService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      // Si ya tiene clave existente, mostrarla directamente
      if (this.claveExistente) {
        this.claveGenerada = this.claveExistente;
      } else {
        this.claveGenerada = '';
        this.listasCompartidas = 0;
      }
      this.copiado = false;
    }
  }

  // ✅ ACTUALIZADO: Generar NUEVA clave (actualiza BD)
  confirmarCompartir() {
    this.loading = true;

    const compartir$ = this.tipo === 'categoria'
      ? this.compartirService.compartirCategoria(this.itemId)
      : this.compartirService.compartirLista(this.itemId);

    compartir$.subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa del servidor:', response);
        
        // Para CATEGORÍAS
        if (this.tipo === 'categoria') {
          if (response.categoria?.claveCompartir) {
            this.claveGenerada = response.categoria.claveCompartir;
            console.log('✅ Clave de categoría:', this.claveGenerada);
          } else if (response.clave) {
            this.claveGenerada = response.clave;
          }
          
          // Guardar información de listas compartidas
          this.listasCompartidas = response.listasCompartidas || 0;
          console.log('✅ Listas compartidas:', this.listasCompartidas);
          
          // Emitir objeto completo
          this.compartido.emit({
            clave: this.claveGenerada,
            listasCompartidas: this.listasCompartidas,
            tipo: 'categoria'
          });
        } 
        // Para LISTAS
        else {
          if (response.lista?.claveCompartir) {
            this.claveGenerada = response.lista.claveCompartir;
            console.log('✅ Clave de lista:', this.claveGenerada);
          } else if (response.clave) {
            this.claveGenerada = response.clave;
          }
          
          // Emitir objeto completo
          this.compartido.emit({
            clave: this.claveGenerada,
            tipo: 'lista'
          });
        }
        
        this.urlCompartir = response.url || '';
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al compartir:', error);
        this.loading = false;
      }
    });
  }

  copiarClave() {
    if (!this.claveGenerada) return;
    
    navigator.clipboard.writeText(this.claveGenerada).then(() => {
      this.copiado = true;
      setTimeout(() => this.copiado = false, 2000);
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }

  copiarUrl() {
    if (!this.urlCompartir) return;
    
    navigator.clipboard.writeText(this.urlCompartir).then(() => {
      this.copiado = true;
      setTimeout(() => this.copiado = false, 2000);
    }).catch(err => {
      console.error('Error al copiar URL:', err);
    });
  }

  cerrar() {
    this.claveGenerada = '';
    this.urlCompartir = '';
    this.copiado = false;
    this.listasCompartidas = 0;
    this.close.emit();
  }
}