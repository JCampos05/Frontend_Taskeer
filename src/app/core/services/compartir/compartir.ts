
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../enviroment/enviroment';

// Interface corregida
export interface CompartirResponse {
  clave?: string;
  url?: string;
  mensaje?: string;
  lista?: {
    idLista: number;
    nombre: string;
    claveCompartir?: string | null;
    tuRol?: string;
    esPropietario?: boolean;
  };
  categoria?: {
    idCategoria: number;
    nombre: string;
    claveCompartir?: string | null;
    esPropietario?: boolean;
  };
  puedesGestionar?: boolean;
}

export interface UsuarioCompartido {
  idUsuario: number;
  nombre: string;
  email: string;
  rol: string;
  esCreador: boolean;
  aceptado: boolean;
  fechaCompartido: Date;
}

export interface InfoCompartidos {
  lista?: {
    idLista: number;
    nombre: string;
    claveCompartir?: string | null;
    tuRol: string;
    esPropietario?: boolean;
  };
  categoria?: {
    idCategoria: number;
    nombre: string;
    claveCompartir?: string | null;
    tipoPrivacidad: string;
    tuRol: string;
    esPropietario?: boolean;
  };
  usuarios: UsuarioCompartido[];
  totalUsuarios: number;
  puedesGestionar?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CompartirService {
  private apiUrl = `${environment.apiUrl}/compartir`;

  constructor(private http: HttpClient) { }

  // ============================================
  // CATEGORÍAS
  // ============================================

  compartirCategoria(categoriaId: number): Observable<CompartirResponse> {
    return this.http.post<CompartirResponse>(
      `${this.apiUrl}/categoria/${categoriaId}/generar-clave`,
      {}
    );
  }

  unirseCategoriaPorClave(clave: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/categoria/unirse`, { clave });
  }

  invitarUsuarioCategoria(categoriaId: number, email: string, rol: string = 'colaborador'): Observable<any> {
    return this.http.post(`${this.apiUrl}/categoria/${categoriaId}/invitar`, { email, rol });
  }

  obtenerUsuariosCategoria(categoriaId: number): Observable<UsuarioCompartido[]> {
    return this.http.get<any>(`${this.apiUrl}/categoria/${categoriaId}/usuarios`).pipe(
      map(response => {
        const usuarios = response.usuarios || [];
        //  AGREGAR: Transformar booleanos
        return usuarios.map((u: any) => ({
          ...u,
          esCreador: Boolean(u.esCreador === 1 || u.esCreador === true),
          aceptado: Boolean(u.aceptado === 1 || u.aceptado === true)
        }));
      })
    );
  }

  modificarRolCategoria(categoriaId: number, usuarioId: number, nuevoRol: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/categoria/${categoriaId}/usuario/${usuarioId}/rol`, { nuevoRol });
  }

  revocarAccesoCategoria(categoriaId: number, usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categoria/${categoriaId}/usuario/${usuarioId}`);
  }

  salirDeCategoria(categoriaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/categoria/${categoriaId}/salir`, {});
  }

  descompartirCategoria(categoriaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/categoria/${categoriaId}/descompartir`, {});
  }

  obtenerCategoriasCompartidas(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/categoria/mis-compartidas`).pipe(
      map(response => response.categorias || [])
    );
  }

  obtenerInfoCompartidosCategoria(categoriaId: number): Observable<InfoCompartidos> {
    return this.http.get<InfoCompartidos>(`${this.apiUrl}/categoria/${categoriaId}/info-compartidos`);
  }

  // ============================================
  // LISTAS
  // ============================================

  // ✅ CORREGIDO - Cambiar tipo de retorno a Observable<any>
  compartirLista(listaId: number): Observable<any> {
    console.log('compartirService.compartirLista() - ID:', listaId);

    return this.http.post<any>(`${this.apiUrl}/lista/${listaId}/generar-clave`, {}).pipe(
      map(response => {
        console.log('Respuesta del backend:', response);
        return {
          clave: response.clave,
          url: response.url || '',
          mensaje: response.mensaje,
          lista: response.lista
        };
      })
    );
  }

  unirseListaPorClave(clave: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/lista/unirse`, { clave });
  }

  invitarUsuarioLista(listaId: number, email: string, rol: string = 'colaborador'): Observable<any> {
    return this.http.post(`${this.apiUrl}/lista/${listaId}/invitar`, { email, rol });
  }

  obtenerUsuariosLista(listaId: number): Observable<UsuarioCompartido[]> {
    return this.http.get<any>(`${this.apiUrl}/lista/${listaId}/usuarios`).pipe(
      map(response => {
        const usuarios = response.usuarios || [];
        // AGREGAR: Transformar booleanos
        return usuarios.map((u: any) => ({
          ...u,
          esCreador: Boolean(u.esCreador === 1 || u.esCreador === true),
          aceptado: Boolean(u.aceptado === 1 || u.aceptado === true)
        }));
      })
    );
  }

  modificarRolLista(idLista: number, idUsuario: number, nuevoRol: string): Observable<any> {
    console.log('🔄 [Service] Modificando rol:', { idLista, idUsuario, nuevoRol });

    return this.http.put(
      `${this.apiUrl}/lista/${idLista}/usuario/${idUsuario}/rol`,
      { nuevoRol }
    ).pipe(
      tap(response => console.log('✅ [Service] Rol modificado:', response)),
      catchError(error => {
        console.error('❌ [Service] Error al modificar rol:', error);
        return throwError(() => error);
      })
    );
  }

  revocarAccesoLista(listaId: number, usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lista/${listaId}/usuario/${usuarioId}`);
  }

  salirDeLista(listaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/lista/${listaId}/salir`, {});
  }

  descompartirLista(listaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/lista/${listaId}/descompartir`, {});
  }

  obtenerListasCompartidas(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/lista/mis-compartidas`).pipe(
      map(response => response.listas || [])
    );
  }

  obtenerInfoCompartidosLista(listaId: number): Observable<InfoCompartidos> {
    return this.http.get<InfoCompartidos>(`${this.apiUrl}/lista/${listaId}/info-compartidos`);
  }

  // ============================================
  // INVITACIONES
  // ============================================

  obtenerInvitacionesPendientes(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/invitaciones/pendientes`).pipe(
      map(response => response.invitaciones || [])
    );
  }

  aceptarInvitacion(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/invitaciones/${token}/aceptar`, {});
  }

  rechazarInvitacion(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/invitaciones/${token}/rechazar`, {});
  }

  // ============================================
  // MÉTODOS GENÉRICOS (RETROCOMPATIBILIDAD)
  // ============================================

  obtenerUsuariosCompartidos(tipo: 'categoria' | 'lista', id: number): Observable<UsuarioCompartido[]> {
    return tipo === 'categoria'
      ? this.obtenerUsuariosCategoria(id)
      : this.obtenerUsuariosLista(id);
  }

  revocarAcceso(tipo: 'categoria' | 'lista', id: number, usuarioId: number): Observable<any> {
    return tipo === 'categoria'
      ? this.revocarAccesoCategoria(id, usuarioId)
      : this.revocarAccesoLista(id, usuarioId);
  }

  cambiarRol(tipo: 'categoria' | 'lista', id: number, usuarioId: number, nuevoRol: string): Observable<any> {
    return tipo === 'categoria'
      ? this.modificarRolCategoria(id, usuarioId, nuevoRol)
      : this.modificarRolLista(id, usuarioId, nuevoRol);
  }

  invitarUsuario(tipo: 'categoria' | 'lista', id: number, email: string, rol: string): Observable<any> {
    return tipo === 'categoria'
      ? this.invitarUsuarioCategoria(id, email, rol)
      : this.invitarUsuarioLista(id, email, rol);
  }

  salir(tipo: 'categoria' | 'lista', id: number): Observable<any> {
    return tipo === 'categoria'
      ? this.salirDeCategoria(id)
      : this.salirDeLista(id);
  }

  descompartir(tipo: 'categoria' | 'lista', id: number): Observable<any> {
    return tipo === 'categoria'
      ? this.descompartirCategoria(id)
      : this.descompartirLista(id);
  }
}