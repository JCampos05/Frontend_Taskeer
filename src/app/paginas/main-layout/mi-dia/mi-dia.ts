import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TableroComponent } from '../../../componentes/principal/tablero/tablero';
import { ClimaService, ClimaData } from '../../../core/services/clima/clima';
import { AuthService } from '../../../core/services/authentication/authentication';

@Component({
  selector: 'app-mi-dia',
  standalone: true,
  imports: [CommonModule, TableroComponent, HttpClientModule],
  templateUrl: './mi-dia.html',
  styleUrl: './mi-dia.css',
  providers: [ClimaService]
})
export class MiDiaComponent implements OnInit, OnDestroy {
  climaData: ClimaData | null = null;
  cargandoClima = false;
  errorClima = false;
  mostrarModalEliminar = false;
  tareaAEliminar: any = null;
  
  private ubicacionListener: any;

  constructor(
    private climaService: ClimaService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.cargarClima();
    
    // Escuchar cambios de ubicación desde configuración
    this.ubicacionListener = (event: any) => {
      console.log('📍 Ubicación actualizada:', event.detail);
      this.cargarClimaPorCiudad(event.detail.ciudad);
    };
    window.addEventListener('ubicacionActualizada', this.ubicacionListener);
  }

  ngOnDestroy() {
    if (this.ubicacionListener) {
      window.removeEventListener('ubicacionActualizada', this.ubicacionListener);
    }
  }

  async cargarClima() {
    this.cargandoClima = true;
    this.errorClima = false;

    try {
      // Primero intentar obtener la ciudad del perfil del usuario
      const usuario = this.authService.obtenerUsuarioActual();
      
      if (usuario?.ubicacion) {
        // Extraer solo el nombre de la ciudad (primera parte antes de la coma)
        const ciudad = usuario.ubicacion.split(',')[0].trim();
        console.log('🏙️ Usando ciudad del perfil:', ciudad);
        
        await this.cargarClimaPorCiudad(ciudad);
        return;
      }

      // Si no hay ciudad en el perfil, intentar geolocalización
      console.log('📍 Solicitando ubicación del dispositivo...');
      const position = await this.climaService.obtenerUbicacionActual();
      
      console.log('✅ Ubicación obtenida:', {
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        precision: position.coords.accuracy + 'm'
      });
      
      this.climaService.obtenerClimaPorCoordenadas(
        position.coords.latitude,
        position.coords.longitude
      ).subscribe({
        next: (data) => {
          console.log('🌤️ Clima obtenido para:', data.ciudad, data.pais);
          this.climaData = data;
          this.cargandoClima = false;
        },
        error: (error) => {
          console.error('❌ Error al obtener clima:', error);
          this.errorClima = true;
          this.cargandoClima = false;
        }
      });
    } catch (error: any) {
      // Si falla todo, usar ciudad por defecto
      console.warn('⚠️ No se pudo obtener ubicación:', error.message);
      console.log('🏙️ Usando ubicación por defecto: Mexico City');
      
      await this.cargarClimaPorCiudad('Mexico City');
    }
  }

  private async cargarClimaPorCiudad(ciudad: string) {
    this.cargandoClima = true;
    this.errorClima = false;
    
    this.climaService.obtenerClimaPorCiudad(ciudad).subscribe({
      next: (data) => {
        console.log('🌤️ Clima obtenido para:', data.ciudad);
        this.climaData = data;
        this.cargandoClima = false;
      },
      error: (error) => {
        console.error('❌ Error al obtener clima para', ciudad, ':', error);
        this.errorClima = true;
        this.cargandoClima = false;
      }
    });
  }

  obtenerFechaHoy(): string {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}