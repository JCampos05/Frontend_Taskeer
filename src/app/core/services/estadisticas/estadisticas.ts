import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface EstadisticasGenerales {
  totalTareas: number;
  tareasCompletadas: number;
  tareasEnProceso: number;
  tareasPendientes: number;
  tareasVencidas: number;
  porcentajeCompletadas: number;
  rachaActual: number;
  rachaMaxima: number;
  tiempoPromedioCompletacion: number; // en días
}

export interface ProductividadPeriodo {
  periodo: string; // 'diaria' | 'semanal' | 'mensual'
  datos: {
    fecha: string;
    completadas: number;
    creadas: number;
  }[];
}

export interface ContribucionDia {
  fecha: string;
  cantidad: number;
  nivel: number; // 0-4 para el color (como GitHub)
}

export interface TareaReciente {
  idTarea: number;
  nombre: string;
  accion: 'completada' | 'creada' | 'modificada';
  fecha: string;
  nombreLista?: string;
  colorLista?: string;
}

export interface CategoriaMasFrecuente {
  nombreCategoria: string;
  cantidad: number;
  porcentaje: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private API_URL = 'http://localhost:3000/api/estadisticas';

  constructor(private http: HttpClient) {}

  // Obtener estadísticas generales del usuario
  async obtenerEstadisticasGenerales(): Promise<EstadisticasGenerales> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/generales`)
      );
      return response.success ? response.data : this.getEstadisticasDefault();
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
      return this.getEstadisticasDefault();
    }
  }

  // Obtener productividad por período
  async obtenerProductividad(periodo: 'diaria' | 'semanal' | 'mensual'): Promise<ProductividadPeriodo> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/productividad/${periodo}`)
      );
      return response.success ? response.data : { periodo, datos: [] };
    } catch (error) {
      console.error('Error al obtener productividad:', error);
      return { periodo, datos: [] };
    }
  }

  // Obtener calendario de contribuciones (tipo GitHub)
  async obtenerCalendarioContribuciones(dias: number = 365): Promise<ContribucionDia[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/calendario-contribuciones?dias=${dias}`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener calendario de contribuciones:', error);
      return [];
    }
  }

  // Obtener historial reciente de tareas
  async obtenerHistorialReciente(limite: number = 10): Promise<TareaReciente[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/historial-reciente?limite=${limite}`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener historial reciente:', error);
      return [];
    }
  }

  // Obtener categorías más frecuentes
  async obtenerCategoriasFrecuentes(limite: number = 5): Promise<CategoriaMasFrecuente[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/categorias-frecuentes?limite=${limite}`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener categorías frecuentes:', error);
      return [];
    }
  }

  // Obtener racha de días completando tareas
  async obtenerRachaCompletacion(): Promise<{ rachaActual: number; rachaMaxima: number }> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/racha-completacion`)
      );
      return response.success ? response.data : { rachaActual: 0, rachaMaxima: 0 };
    } catch (error) {
      console.error('Error al obtener racha:', error);
      return { rachaActual: 0, rachaMaxima: 0 };
    }
  }

  // Estadísticas por defecto cuando hay error
  private getEstadisticasDefault(): EstadisticasGenerales {
    return {
      totalTareas: 0,
      tareasCompletadas: 0,
      tareasEnProceso: 0,
      tareasPendientes: 0,
      tareasVencidas: 0,
      porcentajeCompletadas: 0,
      rachaActual: 0,
      rachaMaxima: 0,
      tiempoPromedioCompletacion: 0
    };
  }
}