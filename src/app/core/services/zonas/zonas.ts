import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ZonaHoraria {
  idZona: number;
  zona: string;
  nombre: string;
  region: string;
  offset_actual: string;
  offset_minutos: number;
  usa_dst: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ZonasService {
  private apiUrl = 'http://localhost:3000/api/zonas';
  private zonaActualSubject = new BehaviorSubject<string | null>(null);
  public zonaActual$ = this.zonaActualSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarZonaUsuario();
  }

  obtenerZonasHorarias(region?: string): Observable<any> {
    let params = new HttpParams();
    if (region) {
      params = params.set('region', region);
    }
    return this.http.get(`${this.apiUrl}/lista`, { params });
  }

  obtenerRegiones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/regiones`);
  }

  obtenerZonaUsuario(): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuario`);
  }

  actualizarZonaUsuario(zonaHoraria: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuario`, { zonaHoraria }).pipe(
      tap(() => {
        this.zonaActualSubject.next(zonaHoraria);
        console.log('✅ Zona horaria actualizada:', zonaHoraria);
      })
    );
  }

  private cargarZonaUsuario() {
    this.obtenerZonaUsuario().subscribe({
      next: (response) => {
        if (response.success && response.zonaHoraria) {
          this.zonaActualSubject.next(response.zonaHoraria);
        }
      },
      error: (error) => {
        console.error('Error al cargar zona horaria:', error);
      }
    });
  }
}