import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Nota {
  idNota?: number;
  titulo: string;
  contenido: string;
  color: string;
  fijada: boolean;
  posicion: number;
  idUsuario?: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotaService {
  private apiUrl = 'http://localhost:3000/api/notas';
  private notasSubject = new BehaviorSubject<Nota[]>([]);
  public notas$ = this.notasSubject.asObservable();

  constructor(private http: HttpClient) {}

  obtenerNotas(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        if (response.success) {
          this.notasSubject.next(response.data);
        }
      })
    );
  }

  crearNota(nota: Partial<Nota>): Observable<any> {
    return this.http.post<any>(this.apiUrl, nota).pipe(
      tap(() => this.obtenerNotas().subscribe())
    );
  }

  actualizarNota(id: number, nota: Partial<Nota>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, nota).pipe(
      tap(() => this.obtenerNotas().subscribe())
    );
  }

  eliminarNota(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.obtenerNotas().subscribe())
    );
  }

  duplicarNota(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/duplicar`, {}).pipe(
      tap(() => this.obtenerNotas().subscribe())
    );
  }

  actualizarPosiciones(notas: Nota[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/posiciones`, { notas });
  }
}