import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../enviroment/enviroment';

export interface Categoria {
  idCategoria?: number;
  nombre: string;
  color?: string;
  icono?: string;
  esPropietario?: boolean;
  esCreador?: boolean;
  rol?: string;
  compartida?: boolean;
  compartible?: boolean;
  cantidadListas?: number;
  claveCompartir?: string;
  tipoPrivacidad?: string;
  nombrePropietario?: string;
  fechaCompartido?: Date;
  listas?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private API_URL = `${environment.apiUrl}/categorias`;
  private COMPARTIR_URL = `${environment.apiUrl}/compartir`;;

  constructor(private http: HttpClient) { }

  async crearCategoria(categoria: Categoria): Promise<any> {
    return firstValueFrom(this.http.post(this.API_URL, categoria));
  }

  async obtenerCategorias(): Promise<Categoria[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(this.API_URL));
      const categorias = response.categorias || [];
      //  AGREGAR: Transformar booleanos
      return categorias.map((cat: any) => ({
        ...cat,
        esPropietario: Boolean(cat.esPropietario),
        esCreador: Boolean(cat.esCreador),
        compartible: Boolean(cat.compartible === 1 || cat.compartible === true)
      }));
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      return [];
    }
  }

  async obtenerCategoria(id: number): Promise<Categoria | null> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
      if (response.success && response.data) {
        //  AGREGAR: Transformar booleanos
        return {
          ...response.data,
          esPropietario: Boolean(response.data.esPropietario),
          esCreador: Boolean(response.data.esCreador),
          compartible: Boolean(response.data.compartible === 1 || response.data.compartible === true)
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      return null;
    }
  }

  async actualizarCategoria(id: number, categoria: Categoria): Promise<any> {
    return firstValueFrom(this.http.put(`${this.API_URL}/${id}`, categoria));
  }

  async eliminarCategoria(id: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
  }

  async obtenerListasPorCategoria(id: number): Promise<any[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}/listas`));
      if (response.success && response.data && response.data.listas) {
        return response.data.listas;
      }
      return [];
    } catch (error) {
      console.error('Error al obtener listas por categoría:', error);
      return [];
    }
  }

  // ✅ NUEVO: Obtener categorías compartidas
  async obtenerCategoriasCompartidas(): Promise<Categoria[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.COMPARTIR_URL}/categoria/mis-compartidas`)
      );
      // El endpoint devuelve { categorias: [...] }
      return response.categorias || [];
    } catch (error) {
      console.error('Error al obtener categorías compartidas:', error);
      return [];
    }
  }

  // ✅ NUEVO: Generar clave para compartir categoría
  async generarClaveCompartir(id: number): Promise<any> {
    try {
      const result: any = await firstValueFrom(
        this.http.post(`${this.COMPARTIR_URL}/categoria/${id}/generar-clave`, {})
      );
      return result;
    } catch (error) {
      console.error('Error al generar clave:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Descompartir categoría
  async descompartirCategoria(id: number): Promise<any> {
    try {
      const result: any = await firstValueFrom(
        this.http.post(`${this.COMPARTIR_URL}/categoria/${id}/descompartir`, {})
      );
      return result;
    } catch (error) {
      console.error('Error al descompartir categoría:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Obtener usuarios con acceso a la categoría
  async obtenerUsuariosConAcceso(id: number): Promise<any[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.COMPARTIR_URL}/categoria/${id}/usuarios`)
      );
      return response.usuarios || [];
    } catch (error) {
      console.error('Error al obtener usuarios con acceso:', error);
      return [];
    }
  }

  // ✅ NUEVO: Obtener información completa de compartidos
  async obtenerInfoCompartidos(id: number): Promise<any> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.COMPARTIR_URL}/categoria/${id}/info-compartidos`)
      );
      return response;
    } catch (error) {
      console.error('Error al obtener info de compartidos:', error);
      return null;
    }
  }
}