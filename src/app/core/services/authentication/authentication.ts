import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../enviroment/enviroment';

export interface RedesSociales {
  linkedin?: string;
  github?: string;
  twitter?: string;
  [key: string]: string | undefined;
}

export interface Usuario {
  idUsuario: number;
  nombre: string;
  apellido?: string;
  email: string;
  emailVerificado: boolean;
  bio?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  cargo?: string | null;
  redes_sociales?: RedesSociales | null;
  fechaRegistro?: string;
  fecha_actualizacion?: string;
  zona_horaria?: string;
}

export interface AuthResponse {
  mensaje: string;
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido?: string;
  email: string;
  password: string;
}

export interface ActualizarPerfilRequest {
  nombre?: string;
  apellido?: string;
  bio?: string;
  telefono?: string;
  ubicacion?: string;
  cargo?: string;
  redes_sociales?: RedesSociales;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNuevo: string;
}

export interface RegisterResponse {
  mensaje: string;
  idUsuario: number;
  email: string;
  emailEnviado?: boolean;
  requiereVerificacion: boolean;
  token?: string;
  usuario?: Usuario;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private tokenKey = 'auth_token';
  private usuarioKey = 'auth_usuario';

  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioAlmacenado());
  public usuarioActual$ = this.usuarioActualSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Registro de usuario
  registrar(datos: RegisterRequest): Observable<AuthResponse> {
    /*const nombreCompleto = datos.apellido
      ? `${datos.nombre} ${datos.apellido}`
      : datos.nombre;*/

    const body = {
      nombre: datos.nombre,
      apellido: datos.apellido || null,
      email: datos.email,
      password: datos.password
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/registrar`, body)
      .pipe(
        tap(response => {
          this.guardarSesion(response.token, response.usuario);
        })
      );
  }

  // Login de usuario
  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, datos)
      .pipe(
        tap(response => {
          this.guardarSesion(response.token, response.usuario);
        })
      );
  }

  // Obtener perfil del usuario
  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/perfil`, {
      headers: this.obtenerHeaders()
    }).pipe(
      tap(usuario => {
        // Actualizar usuario en localStorage y BehaviorSubject
        localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
        this.usuarioActualSubject.next(usuario);
      })
    );
  }

  // Actualizar perfil del usuario
  actualizarPerfil(datos: ActualizarPerfilRequest): Observable<{ mensaje: string; usuario: Usuario }> {
    return this.http.put<{ mensaje: string; usuario: Usuario }>(
      `${this.apiUrl}/perfil`,
      datos,
      { headers: this.obtenerHeaders() }
    ).pipe(
      tap(response => {
        // Actualizar usuario en localStorage y BehaviorSubject
        localStorage.setItem(this.usuarioKey, JSON.stringify(response.usuario));
        this.usuarioActualSubject.next(response.usuario);
      })
    );
  }

  // Actualizar nombre del usuario
  actualizarNombre(nombre: string): Observable<{ mensaje: string; usuario: Usuario }> {
    return this.http.put<{ mensaje: string; usuario: Usuario }>(
      `${this.apiUrl}/perfil`,  // Cambiar de /nombre a /perfil
      { nombre },  // Enviar solo el nombre en el body
      { headers: this.obtenerHeaders() }
    ).pipe(
      tap(response => {
        // Actualizar usuario en localStorage y BehaviorSubject
        localStorage.setItem(this.usuarioKey, JSON.stringify(response.usuario));
        this.usuarioActualSubject.next(response.usuario);
      })
    );
  }

  // Cambiar password del usuario
  cambiarPassword(datos: CambiarPasswordRequest): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(
      `${this.apiUrl}/password`,
      datos,
      { headers: this.obtenerHeaders() }
    );
  }

  // Verificar si existen usuarios en la BD
  verificarUsuarios(): Observable<{ existenUsuarios: boolean }> {
    return this.http.get<{ existenUsuarios: boolean }>(`${this.apiUrl}/verificar`);
  }

  // Guardar sesión
  private guardarSesion(token: string, usuario: Usuario): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
    this.usuarioActualSubject.next(usuario);
  }

  // Obtener token
  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Obtener usuario almacenado
  private obtenerUsuarioAlmacenado(): Usuario | null {
    const usuarioStr = localStorage.getItem(this.usuarioKey);
    if (!usuarioStr || usuarioStr === 'undefined' || usuarioStr === 'null') {
      return null;
    }
    try {
      return JSON.parse(usuarioStr);
    } catch (error) {
      console.error('Error al parsear usuario del localStorage:', error);
      localStorage.removeItem(this.usuarioKey); // Limpiar dato corrupto
      return null;
    }
  }

  // Obtener usuario actual
  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  // Verificar si está autenticado
  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  // Cerrar sesión
  cerrarSesion(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.usuarioActualSubject.next(null);
  }

  // Obtener headers con token
  private obtenerHeaders(): HttpHeaders {
    const token = this.obtenerToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  verificarEmail(idUsuario: number, codigo: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verificar-email`, {
      idUsuario,
      codigo
    }).pipe(
      tap(response => {
        // Guardar sesión automáticamente después de verificar
        this.guardarSesion(response.token, response.usuario);
      })
    );
  }

  // Reenviar código de verificación
  reenviarCodigo(idUsuario: number): Observable<{ mensaje: string; emailEnviado: boolean; intentosRestantes?: number }> {
    return this.http.post<{ mensaje: string; emailEnviado: boolean; intentosRestantes?: number }>(
      `${this.apiUrl}/reenviar-codigo`,
      { idUsuario }
    );
  }

  // Validar contraseña actual
  validarPasswordActual(password: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/validar-password`,
      { password },
      { headers: this.obtenerHeaders() }
    );
  }

  solicitarCodigoCambioPassword(): Observable<{ mensaje: string; emailEnviado: boolean }> {
    return this.http.post<{ mensaje: string; emailEnviado: boolean }>(
      `${this.apiUrl}/solicitar-codigo-cambio-password`,
      {},
      { headers: this.obtenerHeaders() }
    );
  }

  obtenerPerfilPorId(idUsuario: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${idUsuario}/perfil`, {
      headers: this.obtenerHeaders()
    });
  }

  solicitarRecuperacionPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperar-password`, { email });
  }

  verificarCodigoRecuperacion(email: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar-recuperacion`, {
      email,
      codigo
    });
  }

  establecerNuevaPassword(tokenTemporal: string, nuevaPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/establecer-nueva-password`, {
      tokenTemporal,
      nuevaPassword
    }).pipe(
      tap((response: any) => {
        // Si la respuesta incluye un nuevo token de sesión, guardarlo
        if (response.token) {
          this.guardarSesion(response.token, response.usuario);
        }
      })
    );
  }
}
