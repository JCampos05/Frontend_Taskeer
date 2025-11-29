import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';
import { environment } from '../../../../enviroment/enviroment';

// Interfaz para las respuestas del API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Lista {
  idLista?: number;
  nombre: string;
  color?: string;
  icono?: string;
  importante?: boolean;
  compartible?: boolean;
  claveCompartir?: string | null;
  idCategoria?: number | null;
  nombreCategoria?: string;
  idUsuario?: number;
  esPropietario?: boolean;
  esCompartidaConmigo?: boolean;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  rol?: string; // Rol del usuario en lista compartida
  nombrePropietario?: string;
  emailPropietario?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ListasService {
  private API_URL = `${environment.apiUrl}/listas`;
  private COMPARTIR_URL = `${environment.apiUrl}/compartir`;

  // Evento para notificar cambios en las listas
  private listasCambiadasSubject = new Subject<void>();
  listasCambiadas$ = this.listasCambiadasSubject.asObservable();

  constructor(private http: HttpClient) { }

  private transformarBooleanos(lista: any): Lista {
    return {
      ...lista,
      importante: Boolean(lista.importante === 1 || lista.importante === true),
      compartible: Boolean(lista.compartible === 1 || lista.compartible === true),
      esPropietario: Boolean(lista.esPropietario),
      esCompartidaConmigo: Boolean(lista.esCompartidaConmigo)
    };
  }

  // Método privado para notificar cambios
  private notificarCambio() {
    this.listasCambiadasSubject.next();
  }

  async crearLista(lista: Lista): Promise<any> {
    const result = await firstValueFrom(this.http.post(this.API_URL, lista));
    this.notificarCambio();
    return result;
  }

  async obtenerListas(): Promise<Lista[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(this.API_URL));
      const listas = response.success ? response.data : [];
      return listas.map((lista: any) => ({
        ...lista,
        importante: Boolean(lista.importante === 1 || lista.importante === true),
        compartible: Boolean(lista.compartible === 1 || lista.compartible === true),
        esPropietario: Boolean(lista.esPropietario),
        esCompartidaConmigo: Boolean(lista.esCompartidaConmigo)
      }));
    } catch (error) {
      console.error('Error al obtener listas:', error);
      return [];
    }
  }

  async obtenerLista(id: number): Promise<Lista | null> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
      if (response.success && response.data) {
        //  AGREGAR: Transformar booleanos
        return {
          ...response.data,
          importante: Boolean(response.data.importante === 1 || response.data.importante === true),
          compartible: Boolean(response.data.compartible === 1 || response.data.compartible === true)
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener lista:', error);
      return null;
    }
  }

  async actualizarLista(id: number, lista: Partial<Lista>): Promise<any> {
    const result = await firstValueFrom(this.http.put(`${this.API_URL}/${id}`, lista));
    this.notificarCambio();
    return result;
  }

  async eliminarLista(id: number): Promise<any> {
    const result = await firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
    this.notificarCambio();
    return result;
  }

  async obtenerListaConTareas(id: number): Promise<any> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}/tareas`));

      if (response.success && response.data) {
        if (response.data.tareas && Array.isArray(response.data.tareas)) {

          //CRÍTICO: Normalización explícita para forzar detección de cambios
          response.data.tareas = response.data.tareas.map((tarea: any) => {
            const normalizada = {
              ...tarea,
              miDia: Boolean(tarea.miDia === 1 || tarea.miDia === true),
              repetir: Boolean(tarea.repetir === 1 || tarea.repetir === true),
              importante: Boolean(tarea.importante === 1 || tarea.importante === true)
            };
            return normalizada;
          });
        }
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener lista con tareas:', error);
      return null;
    }
  }

  async obtenerListasSinCategoria(): Promise<Lista[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/sin-categoria`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener listas sin categoría:', error);
      const listas = await this.obtenerListas();
      return listas.filter(lista => lista.idCategoria === null || lista.idCategoria === undefined);
    }
  }

  async obtenerListasImportantes(): Promise<Lista[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/importantes`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener listas importantes:', error);
      return [];
    }
  }

  async obtenerListasPropias(): Promise<Lista[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Lista[]>>(`${this.API_URL}/propias`)
      );

      if (response && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error al obtener listas propias:', error);
      throw error;
    }
  }

  async obtenerListasCompartidas(): Promise<Lista[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.COMPARTIR_URL}/lista/mis-compartidas`)
      );

      if (response && response.listas) {
        //  AGREGAR: Transformar booleanos
        return response.listas.map((lista: any) => ({
          ...lista,
          importante: Boolean(lista.importante === 1 || lista.importante === true),
          compartible: Boolean(lista.compartible === 1 || lista.compartible === true),
          esPropietario: Boolean(lista.esPropietario),
          esCompartidaConmigo: Boolean(lista.esCompartidaConmigo)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error al obtener listas compartidas:', error);
      throw error;
    }
  }

  // Generar clave para compartir
  async hacerCompartible(id: number): Promise<any> {
    try {
      console.log('🔵 Generando clave para lista, ID:', id);

      // Usar el nuevo endpoint de compartir
      const result: any = await firstValueFrom(
        this.http.post(`${this.COMPARTIR_URL}/lista/${id}/generar-clave`, {})
      );

      console.log('✅ Clave generada exitosamente:', result);
      this.notificarCambio();
      return result;

    } catch (error) {
      console.error('❌ Error al generar clave:', error);
      throw error;
    }
  }

  // ✅ ACTUALIZADO: Descompartir lista (revocar todos los accesos)
  async quitarCompartir(id: number): Promise<any> {
    try {
      const result: any = await firstValueFrom(
        this.http.post(`${this.COMPARTIR_URL}/lista/${id}/descompartir`, {})
      );
      this.notificarCambio();
      return result;
    } catch (error) {
      console.error('Error al descompartir lista:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Obtener información de usuarios con acceso
  async obtenerUsuariosConAcceso(id: number): Promise<any[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.COMPARTIR_URL}/lista/${id}/usuarios`)
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
        this.http.get(`${this.COMPARTIR_URL}/lista/${id}/info-compartidos`)
      );
      return response;
    } catch (error) {
      console.error('Error al obtener info de compartidos:', error);
      return null;
    }
  }
}