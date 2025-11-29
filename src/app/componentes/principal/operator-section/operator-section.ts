import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriasService, Categoria } from '../../../core/services/categorias/categorias';
import { ListasService, Lista } from '../../../core/services/listas/listas';

@Component({
  selector: 'app-admin-sections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operator-section.html',
  styleUrl: './operator-section.css'
})
export class AdminSectionsComponent implements OnInit {
  // Categorías
  categorias: Categoria[] = [];
  nombreCategoria = '';
  categoriaEditando: number | null = null;

  // Listas
  listas: Lista[] = [];
  nombreLista = '';
  colorLista = '#000000';
  iconoLista = '';
  categoriaLista: number | null = null;
  listaEditando: number | null = null;

  constructor(
    private categoriasService: CategoriasService,
    private listasService: ListasService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarCategorias();
    this.cargarListas();
  }

  // ============ CATEGORÍAS ============

  async cargarCategorias() {
    try {
      this.categorias = await this.categoriasService.obtenerCategorias();
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  async onSubmitCategoria() {
    if (!this.nombreCategoria.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      const categoria: Categoria = {
        nombre: this.nombreCategoria.trim()
      };

      if (this.categoriaEditando) {
        await this.categoriasService.actualizarCategoria(this.categoriaEditando, categoria);
      } else {
        await this.categoriasService.crearCategoria(categoria);
      }

      this.limpiarFormularioCategoria();
      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      alert('Error al guardar la categoría');
    }
  }

  editarCategoria(categoria: Categoria) {
    this.categoriaEditando = categoria.idCategoria!;
    this.nombreCategoria = categoria.nombre;
  }

  async eliminarCategoria(id: number) {
    if (!confirm('¿Eliminar esta categoría? Las listas asociadas quedarán sin categoría.')) {
      return;
    }

    try {
      await this.categoriasService.eliminarCategoria(id);
      await this.cargarCategorias();
      await this.cargarListas();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      alert('Error al eliminar la categoría');
    }
  }

  async verCategoria(id: number) {
    try {
      const listas = await this.categoriasService.obtenerListasPorCategoria(id);
      const categoria = this.categorias.find(c => c.idCategoria === id);
      const nombresListas = listas.map((l: any) => l.nombre).join(', ');
      alert(`Categoría: ${categoria?.nombre}\nListas: ${listas.length}\n${nombresListas}`);
    } catch (error) {
      console.error('Error al ver categoría:', error);
    }
  }

  limpiarFormularioCategoria() {
    this.categoriaEditando = null;
    this.nombreCategoria = '';
  }

  get btnTextoCategoria(): string {
    return this.categoriaEditando ? 'Actualizar Categoría' : 'Agregar Categoría';
  }

  // ============ LISTAS ============

  async cargarListas() {
    try {
      this.listas = await this.listasService.obtenerListas();
    } catch (error) {
      console.error('Error al cargar listas:', error);
    }
  }

  async onSubmitLista() {
    if (!this.nombreLista.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      const lista: Lista = {
        nombre: this.nombreLista.trim(),
        color: this.colorLista || undefined,
        icono: this.iconoLista.trim() || undefined,
        idCategoria: this.categoriaLista || undefined
      };

      if (this.listaEditando) {
        await this.listasService.actualizarLista(this.listaEditando, lista);
      } else {
        await this.listasService.crearLista(lista);
      }

      this.limpiarFormularioLista();
      await this.cargarListas();
    } catch (error) {
      console.error('Error al guardar lista:', error);
      alert('Error al guardar la lista');
    }
  }

  editarLista(lista: Lista) {
    this.listaEditando = lista.idLista!;
    this.nombreLista = lista.nombre;
    this.colorLista = lista.color || '#000000';
    this.iconoLista = lista.icono || '';
    this.categoriaLista = lista.idCategoria || null;
  }

  async eliminarLista(id: number) {
    if (!confirm('¿Eliminar esta lista? Las tareas asociadas quedarán sin lista.')) {
      return;
    }

    try {
      await this.listasService.eliminarLista(id);
      await this.cargarListas();
    } catch (error) {
      console.error('Error al eliminar lista:', error);
      alert('Error al eliminar la lista');
    }
  }

  async verListaConTareas(id: number) {
    try {
      const data = await this.listasService.obtenerListaConTareas(id);
      if (data && data.tareas) {
        alert(`Lista: ${data.nombre}\nTareas: ${data.tareas.length}`);
      }
    } catch (error) {
      console.error('Error al ver lista:', error);
    }
  }

  limpiarFormularioLista() {
    this.listaEditando = null;
    this.nombreLista = '';
    this.colorLista = '#000000';
    this.iconoLista = '';
    this.categoriaLista = null;
  }

  get btnTextoLista(): string {
    return this.listaEditando ? 'Actualizar Lista' : 'Agregar Lista';
  }

  getNombreCategoria(idCategoria: number | null | undefined): string {
    if (!idCategoria) return 'Sin categoría';
    const categoria = this.categorias.find(c => c.idCategoria === idCategoria);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

  cerrar() {
    this.router.navigate(['/tareas']);
  }
}
