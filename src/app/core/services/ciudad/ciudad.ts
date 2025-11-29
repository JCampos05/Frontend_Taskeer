import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../../../enviroment/enviroment';

export interface Ciudad {
  nombre: string;
  pais: string;
  region?: string;
  nombreCompleto: string; // "Ciudad, Region, Pais"
  lat: number;
  lon: number;
}

@Injectable({
  providedIn: 'root'
})
export class CiudadAutocompleteService {
  private apiKey = environment.weatherApiKey; // Tu API key de WeatherAPI
  private apiUrl = 'https://api.weatherapi.com/v1/search.json';

  constructor(private http: HttpClient) {}

  buscarCiudades(query: string): Observable<Ciudad[]> {
    if (!query || query.length < 2) {
      console.log('⚠️ Query muy corto en servicio:', query);
      return of([]);
    }

    const url = `${this.apiUrl}?key=${this.apiKey}&q=${encodeURIComponent(query)}&lang=es`;
    console.log('🌐 Llamando a API:', url);
    
    return this.http.get<any[]>(url).pipe(
      map(resultados => {
        console.log('📦 Respuesta de API:', resultados);
        const ciudades = resultados.map(ciudad => ({
          nombre: ciudad.name,
          pais: ciudad.country,
          region: ciudad.region,
          nombreCompleto: this.formatearNombreCiudad(ciudad),
          lat: ciudad.lat,
          lon: ciudad.lon
        }));
        console.log('🏙️ Ciudades formateadas:', ciudades);
        return ciudades;
      }),
      catchError(error => {
        console.error('❌ Error al buscar ciudades:', error);
        return of([]);
      })
    );
  }

  private formatearNombreCiudad(ciudad: any): string {
    const partes = [ciudad.name];
    
    // Agregar región si existe y es diferente del nombre
    if (ciudad.region && ciudad.region !== ciudad.name) {
      partes.push(ciudad.region);
    }
    
    partes.push(ciudad.country);
    
    return partes.join(', ');
  }
}