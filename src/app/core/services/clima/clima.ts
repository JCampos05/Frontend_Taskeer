import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ClimaData {
  temperatura: number;
  sensacionTermica: number;
  descripcion: string;
  humedad: number;
  viento: number;
  icono: string;
  ciudad: string;
  pais: string;
  condicion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClimaService {
  private apiKey = '107d3548ebcd48fda1363047251711'; // Reemplazar con tu API key de WeatherAPI.com
  private apiUrl = 'https://api.weatherapi.com/v1/current.json';

  constructor(private http: HttpClient) { }

  obtenerClimaPorCoordenadas(lat: number, lon: number): Observable<ClimaData> {
    const url = `${this.apiUrl}?key=${this.apiKey}&q=${lat},${lon}&lang=es&aqi=no`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.transformarRespuesta(response)),
      catchError(error => {
        console.error('Error al obtener clima:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerClimaPorCiudad(ciudad: string): Observable<ClimaData> {
    const url = `${this.apiUrl}?key=${this.apiKey}&q=${ciudad}&lang=es&aqi=no`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.transformarRespuesta(response)),
      catchError(error => {
        console.error('Error al obtener clima:', error);
        return throwError(() => error);
      })
    );
  }

  private transformarRespuesta(response: any): ClimaData {
    return {
      temperatura: Math.round(response.current.temp_c),
      sensacionTermica: Math.round(response.current.feelslike_c),
      descripcion: response.current.condition.text,
      humedad: response.current.humidity,
      viento: Math.round(response.current.wind_kph),
      icono: this.obtenerIconoClima(response.current.condition.code, response.current.is_day),
      ciudad: response.location.name,
      pais: response.location.country,
      condicion: response.current.condition.text
    };
  }

  private obtenerIconoClima(codigo: number, esDia: number): string {
    // Códigos de WeatherAPI: https://www.weatherapi.com/docs/weather-conditions.xml
    const esDeNoche = esDia === 0;

    // Soleado/Despejado (1000)
    if (codigo === 1000) {
      return esDeNoche ? 'fa-moon' : 'fa-sun';
    }
    
    // Parcialmente nublado (1003)
    if (codigo === 1003) {
      return esDeNoche ? 'fa-cloud-moon' : 'fa-cloud-sun';
    }
    
    // Nublado (1006, 1009)
    if (codigo === 1006 || codigo === 1009) {
      return 'fa-cloud';
    }
    
    // Niebla/Bruma (1030, 1135, 1147)
    if ([1030, 1135, 1147].includes(codigo)) {
      return 'fa-smog';
    }
    
    // Lluvia ligera/llovizna (1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1240)
    if ([1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1240].includes(codigo)) {
      return 'fa-cloud-rain';
    }
    
    // Lluvia moderada/fuerte (1192, 1195, 1198, 1201, 1243, 1246)
    if ([1192, 1195, 1198, 1201, 1243, 1246].includes(codigo)) {
      return 'fa-cloud-showers-heavy';
    }
    
    // Nieve (1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264)
    if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264].includes(codigo)) {
      return 'fa-snowflake';
    }
    
    // Tormenta eléctrica (1087, 1273, 1276, 1279, 1282)
    if ([1087, 1273, 1276, 1279, 1282].includes(codigo)) {
      return 'fa-bolt';
    }
    
    // Lluvia helada/aguanieve (1069, 1072, 1204, 1207, 1249, 1252)
    if ([1069, 1072, 1204, 1207, 1249, 1252].includes(codigo)) {
      return 'fa-icicles';
    }

    // Default: nublado
    return 'fa-cloud';
  }

  obtenerUbicacionActual(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }
}