import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TareasService, Tarea } from '../../core/services/tareas/tareas';
import { ListasService, Lista } from '../../core/services/listas/listas';

interface ResultadoBusquedaTarea {
  tarea: Tarea;
  score: number;
  matches: { campo: string; indices: number[] }[];
}

interface ResultadoBusquedaLista {
  lista: Lista;
  score: number;
  matches: { campo: string; indices: number[] }[];
}

@Component({
  selector: 'app-main-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main-search.html',
  styleUrl: './main-search.css'
})
export class MainSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event) {
    event.preventDefault();
    this.manejarEscape();
  }

  query: string = '';
  resultadosTareas: ResultadoBusquedaTarea[] = [];
  resultadosListas: ResultadoBusquedaLista[] = [];
  todasTareas: Tarea[] = [];
  listas: Lista[] = [];
  buscando: boolean = false;
  sinResultados: boolean = false;

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
    
    // Obtener query de la URL si existe
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.query = params['q'];
        this.buscar();
      }
    });
  }

  async cargarDatos() {
    try {
      this.listas = await this.listasService.obtenerListas();
      this.todasTareas = await this.tareasService.obtenerTareas();
      
      // Agregar información de lista a cada tarea
      this.todasTareas = this.todasTareas.map(tarea => {
        if (tarea.idLista) {
          const lista = this.listas.find(l => l.idLista === tarea.idLista);
          if (lista) {
            tarea.iconoLista = lista.icono;
            tarea.colorLista = lista.color;
            tarea.nombreLista = lista.nombre;
          }
        }
        return tarea;
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }

  buscar() {
    if (!this.query.trim()) {
      this.resultadosTareas = [];
      this.resultadosListas = [];
      this.sinResultados = false;
      return;
    }

    this.buscando = true;
    
    // Buscar en tareas
    this.resultadosTareas = this.fuzzySearchTareas(this.query, this.todasTareas);
    
    // Buscar en listas
    this.resultadosListas = this.fuzzySearchListas(this.query, this.listas);
    
    this.sinResultados = this.resultadosTareas.length === 0 && this.resultadosListas.length === 0;
    this.buscando = false;
  }

  fuzzySearchTareas(query: string, tareas: Tarea[]): ResultadoBusquedaTarea[] {
    const queryLower = query.toLowerCase();
    const resultados: ResultadoBusquedaTarea[] = [];

    for (const tarea of tareas) {
      const matches: { campo: string; indices: number[] }[] = [];
      let totalScore = 0;

      // Buscar en nombre
      const nombreMatch = this.fuzzyMatch(queryLower, (tarea.nombre || '').toLowerCase());
      if (nombreMatch.score > 0) {
        matches.push({ campo: 'nombre', indices: nombreMatch.indices });
        totalScore += nombreMatch.score * 3; // Mayor peso al nombre
      }

      // Buscar en descripción
      if (tarea.descripcion) {
        const descripcionMatch = this.fuzzyMatch(queryLower, tarea.descripcion.toLowerCase());
        if (descripcionMatch.score > 0) {
          matches.push({ campo: 'descripcion', indices: descripcionMatch.indices });
          totalScore += descripcionMatch.score * 1.5;
        }
      }

      // Buscar en nombre de lista
      if (tarea.nombreLista) {
        const listaMatch = this.fuzzyMatch(queryLower, tarea.nombreLista.toLowerCase());
        if (listaMatch.score > 0) {
          matches.push({ campo: 'lista', indices: listaMatch.indices });
          totalScore += listaMatch.score;
        }
      }

      if (matches.length > 0) {
        resultados.push({
          tarea,
          score: totalScore,
          matches
        });
      }
    }

    // Ordenar por score descendente
    return resultados.sort((a, b) => b.score - a.score);
  }

  fuzzySearchListas(query: string, listas: Lista[]): ResultadoBusquedaLista[] {
    const queryLower = query.toLowerCase();
    const resultados: ResultadoBusquedaLista[] = [];

    for (const lista of listas) {
      const matches: { campo: string; indices: number[] }[] = [];
      let totalScore = 0;

      // Buscar en nombre de lista
      const nombreMatch = this.fuzzyMatch(queryLower, (lista.nombre || '').toLowerCase());
      if (nombreMatch.score > 0) {
        matches.push({ campo: 'nombre', indices: nombreMatch.indices });
        totalScore += nombreMatch.score * 3;
      }

      if (matches.length > 0) {
        resultados.push({
          lista,
          score: totalScore,
          matches
        });
      }
    }

    // Ordenar por score descendente
    return resultados.sort((a, b) => b.score - a.score);
  }

  fuzzyMatch(pattern: string, text: string): { score: number; indices: number[] } {
    const indices: number[] = [];
    let score = 0;
    let patternIdx = 0;
    let textIdx = 0;
    let consecutiveMatches = 0;

    while (patternIdx < pattern.length && textIdx < text.length) {
      if (pattern[patternIdx] === text[textIdx]) {
        indices.push(textIdx);
        consecutiveMatches++;
        score += 10 + (consecutiveMatches * 5); // Bonus por coincidencias consecutivas
        patternIdx++;
      } else {
        consecutiveMatches = 0;
      }
      textIdx++;
    }

    // Si no se encontraron todos los caracteres
    if (patternIdx !== pattern.length) {
      return { score: 0, indices: [] };
    }

    // Bonus si coincide al inicio
    if (indices.length > 0 && indices[0] === 0) {
      score += 20;
    }

    // Penalizar por distancia entre coincidencias
    for (let i = 1; i < indices.length; i++) {
      const gap = indices[i] - indices[i - 1];
      if (gap > 1) {
        score -= (gap - 1) * 2;
      }
    }

    return { score: Math.max(0, score), indices };
  }

  obtenerTextoResaltado(texto: string, campo: string, matches: { campo: string; indices: number[] }[]): string {
    const match = matches.find(m => m.campo === campo);
    if (!match || !match.indices || match.indices.length === 0) {
      return texto;
    }
    return this.resaltarTexto(texto, match.indices);
  }

  resaltarTexto(texto: string, indices: number[]): string {
    if (!indices || indices.length === 0) return texto;

    let resultado = '';
    let ultimoIdx = 0;

    for (const idx of indices) {
      resultado += texto.substring(ultimoIdx, idx);
      resultado += `<mark>${texto[idx]}</mark>`;
      ultimoIdx = idx + 1;
    }
    resultado += texto.substring(ultimoIdx);

    return resultado;
  }

  verTarea(resultado: ResultadoBusquedaTarea) {
    // Primero cerrar el modal, luego navegar
    const idLista = resultado.tarea.idLista;
    
    if (idLista) {
      // Navegar fuera de /buscar primero
      this.router.navigate(['/app/lista', idLista]);
    } else {
      this.router.navigate(['/app/todas-tareas']);
    }
  }

  irALista(resultado: ResultadoBusquedaLista) {
    // Navegar fuera de /buscar
    this.router.navigate(['/app/lista', resultado.lista.idLista]);
  }

  contarTareasLista(idLista: number | undefined): number {
    if (!idLista) return 0;
    return this.todasTareas.filter(t => t.idLista === idLista).length;
  }

  async cambiarEstado(tarea: Tarea, event: Event) {
    event.stopPropagation();
    
    if (!tarea.idTarea) return;

    try {
      const nuevoEstado = tarea.estado === 'C' ? 'P' : 'C';
      await this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado);
      await this.cargarDatos();
      this.buscar(); // Refrescar resultados
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }

  seleccionarPrimero() {
    if (this.resultadosListas.length > 0) {
      this.irALista(this.resultadosListas[0]);
    } else if (this.resultadosTareas.length > 0) {
      this.verTarea(this.resultadosTareas[0]);
    }
  }

  limpiarBusqueda() {
    this.query = '';
    this.resultadosTareas = [];
    this.resultadosListas = [];
    this.sinResultados = false;
    this.searchInput?.nativeElement.focus();
  }

  manejarEscape() {
    // Si hay query, limpiar. Si no hay query, cerrar modal
    if (this.query) {
      this.limpiarBusqueda();
    } else {
      this.cerrarModal();
    }
  }

  cerrarModal() {
    // Navegar a la ruta padre (salir de /app/buscar)
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  getPrioridadClass(prioridad: string): string {
    const clases: any = {
      'A': 'prioridad-alta',
      'N': 'prioridad-normal',
      'B': 'prioridad-baja'
    };
    return clases[prioridad] || 'prioridad-normal';
  }

  getPrioridadTexto(prioridad: string): string {
    const textos: any = {
      'A': 'Alta',
      'N': 'Normal',
      'B': 'Baja'
    };
    return textos[prioridad] || 'Normal';
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    return !icono.trim().startsWith('fa');
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-list';
    }

    const iconoLimpio = icono.trim();

    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    return 'fas fa-list';
  }

  obtenerColorFondo(color: string | null | undefined): string {
    if (!color) return '#f3f4f6';
    
    // Convertir el color a un fondo más suave (agregar opacidad)
    // Si el color es en formato hex, convertirlo a rgba con opacidad
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.15)`;
    }
    
    // Si ya es rgba o rgb, retornar tal cual
    return color;
  }
}