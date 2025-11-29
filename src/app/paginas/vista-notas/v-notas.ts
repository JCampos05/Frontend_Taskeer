import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { NotaService, Nota } from '../../core/services/notas/notas';
import { NotaCardComponent } from '../../componentes/principal/notas/notas';

@Component({
  selector: 'app-notas-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    NotaCardComponent
  ],
  templateUrl: './v-notas.html',
  styleUrls: ['./v-notas.css']
})
export class NotasComponent implements OnInit {
  notas: Nota[] = [];
  notasFijadas: Nota[] = [];
  notasNormales: Nota[] = [];
  
  mostrarModal = false;
  notaActual: Partial<Nota> = this.nuevaNota();
  esEdicion = false;

  coloresDisponibles = [
    { nombre: 'Amarillo', valor: '#FFF740' },
    { nombre: 'Rojo', valor: '#FF6B6B' },
    { nombre: 'Verde', valor: '#95E1D3' },
    { nombre: 'Azul', valor: '#A8D8EA' },
    { nombre: 'Naranja', valor: '#FFB347' },
    { nombre: 'Morado', valor: '#DDA0DD' },
    { nombre: 'Rosa', valor: '#FFB6C1' },
    { nombre: 'Blanco', valor: '#FFFFFF' }
  ];

  constructor(private notaService: NotaService) {}

  ngOnInit(): void {
    this.cargarNotas();
    
    // ✅ SUSCRIBIRSE A CAMBIOS EN TIEMPO REAL
    this.notaService.notas$.subscribe(notas => {
      this.notas = notas;
      this.separarNotas();
    });
  }

  cargarNotas(): void {
    this.notaService.obtenerNotas().subscribe({
      next: (response) => {
        if (response.success) {
          this.notas = response.data;
          this.separarNotas();
        }
      },
      error: (error) => console.error('Error al cargar notas:', error)
    });
  }

  separarNotas(): void {
    this.notasFijadas = this.notas.filter(n => n.fijada);
    this.notasNormales = this.notas.filter(n => !n.fijada);
  }

  nuevaNota(): Partial<Nota> {
    return {
      titulo: '',
      contenido: '',
      color: '#FFF740',
      fijada: false,
      posicion: 0
    };
  }

  abrirModal(nota?: Nota): void {
    if (nota) {
      this.notaActual = { ...nota };
      this.esEdicion = true;
    } else {
      this.notaActual = this.nuevaNota();
      this.esEdicion = false;
    }
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.notaActual = this.nuevaNota();
    this.esEdicion = false;
  }

  guardarNota(): void {
    if (!this.notaActual.titulo?.trim() && !this.notaActual.contenido?.trim()) {
      return;
    }

    if (this.esEdicion && this.notaActual.idNota) {
      this.notaService.actualizarNota(this.notaActual.idNota, this.notaActual)
        .subscribe({
          next: () => {
            this.cerrarModal();
            // ✅ YA NO ES NECESARIO RECARGAR, se actualiza automáticamente por el observable
          },
          error: (error) => console.error('Error al actualizar nota:', error)
        });
    } else {
      this.notaService.crearNota(this.notaActual).subscribe({
        next: () => {
          this.cerrarModal();
          // ✅ YA NO ES NECESARIO RECARGAR, se actualiza automáticamente por el observable
        },
        error: (error) => console.error('Error al crear nota:', error)
      });
    }
  }

  toggleFijada(nota: Nota): void {
    this.notaService.actualizarNota(nota.idNota!, { fijada: !nota.fijada })
      .subscribe({
        error: (error) => console.error('Error al fijar nota:', error)
      });
  }

  eliminarNota(idNota: number): void {
    if (confirm('¿Estás seguro de eliminar esta nota?')) {
      this.notaService.eliminarNota(idNota).subscribe({
        error: (error) => console.error('Error al eliminar nota:', error)
      });
    }
  }

  duplicarNota(idNota: number): void {
    this.notaService.duplicarNota(idNota).subscribe({
      error: (error) => console.error('Error al duplicar nota:', error)
    });
  }

  drop(event: CdkDragDrop<Nota[]>): void {
    const lista = event.container.id === 'fijadas' ? this.notasFijadas : this.notasNormales;
    moveItemInArray(lista, event.previousIndex, event.currentIndex);
    
    const notasActualizadas = [...this.notasFijadas, ...this.notasNormales];
    this.notaService.actualizarPosiciones(notasActualizadas).subscribe({
      error: (error) => console.error('Error al actualizar posiciones:', error)
    });
  }
}