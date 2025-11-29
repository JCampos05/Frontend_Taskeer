import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService, Usuario } from '../../core/services/authentication/authentication';
import {
  EstadisticasService,
  EstadisticasGenerales,
  ProductividadPeriodo,
  ContribucionDia,
  TareaReciente,
  CategoriaMasFrecuente
} from '../../core/services/estadisticas/estadisticas';

Chart.register(...registerables);

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css'
})
export class MiPerfilComponent implements OnInit {
  usuario: Usuario | null = null;
  estadisticas: EstadisticasGenerales | null = null;
  productividad: ProductividadPeriodo | null = null;
  contribuciones: ContribucionDia[] = [];
  historialReciente: TareaReciente[] = [];
  categoriasFrecuentes: CategoriaMasFrecuente[] = [];

  periodoSeleccionado: 'diaria' | 'semanal' | 'mensual' = 'semanal';
  cargando = true;

  private chartRendimiento: Chart | null = null;
  private chartCategorias: Chart | null = null;

  constructor(
    private authService: AuthService,
    private estadisticasService: EstadisticasService,
    private router: Router
  ) { }

  async ngOnInit() {
    // Obtener perfil completo desde el servidor
    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
      },
      error: (error) => {
        console.error('Error al obtener perfil:', error);
        this.usuario = this.authService.obtenerUsuarioActual();
      }
    });

    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const [estadisticas, productividad, contribuciones, historial, categorias] = await Promise.all([
        this.estadisticasService.obtenerEstadisticasGenerales(),
        this.estadisticasService.obtenerProductividad(this.periodoSeleccionado),
        this.estadisticasService.obtenerCalendarioContribuciones(),
        this.estadisticasService.obtenerHistorialReciente(10),
        this.estadisticasService.obtenerCategoriasFrecuentes(5)
      ]);

      this.estadisticas = estadisticas;
      this.productividad = productividad;
      this.contribuciones = contribuciones;
      this.historialReciente = historial;
      this.categoriasFrecuentes = categorias;

      setTimeout(() => {
        this.renderizarGraficas();
      }, 100);
    } catch (error) {
      console.error('Error al cargar datos del perfil:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cambiarPeriodo(periodo: 'diaria' | 'semanal' | 'mensual') {
    this.periodoSeleccionado = periodo;
    this.productividad = await this.estadisticasService.obtenerProductividad(periodo);
    this.renderizarGraficoRendimiento();
  }

  renderizarGraficas() {
    this.renderizarGraficoRendimiento();
    this.renderizarGraficoCategorias();
  }

  renderizarGraficoRendimiento() {
    if (this.chartRendimiento) {
      this.chartRendimiento.destroy();
    }

    const canvas = document.getElementById('chartRendimiento') as HTMLCanvasElement;
    if (!canvas || !this.productividad) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.productividad.datos.map(d => this.formatearFechaCorta(d.fecha)),
        datasets: [
          {
            label: 'Completadas',
            data: this.productividad.datos.map(d => d.completadas),
            borderColor: '#00875a',
            backgroundColor: 'rgba(0, 135, 90, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Creadas',
            data: this.productividad.datos.map(d => d.creadas),
            borderColor: '#0052cc',
            backgroundColor: 'rgba(0, 82, 204, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartRendimiento = new Chart(ctx, config);
  }

  renderizarGraficoCategorias() {
    if (this.chartCategorias) {
      this.chartCategorias.destroy();
    }

    const canvas = document.getElementById('chartCategorias') as HTMLCanvasElement;
    if (!canvas || this.categoriasFrecuentes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.categoriasFrecuentes.map(c => c.nombreCategoria),
        datasets: [{
          data: this.categoriasFrecuentes.map(c => c.cantidad),
          backgroundColor: [
            '#0052cc',
            '#6554c0',
            '#00875a',
            '#ff991f',
            '#ff5630'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    };

    this.chartCategorias = new Chart(ctx, config);
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }

  formatearFechaCorta(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  }

  formatearMiembroDesde(fecha: string | undefined): string {
    if (!fecha) return 'Fecha no disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }

  formatearFechaCompleta(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerColorAccion(accion: string): string {
    const colores: Record<string, string> = {
      'completada': '#00875a',
      'creada': '#0052cc',
      'modificada': '#6554c0'
    };
    return colores[accion] || '#42526e';
  }

  obtenerIconoAccion(accion: string): string {
    const iconos: Record<string, string> = {
      'completada': 'fa-check-circle',
      'creada': 'fa-plus-circle',
      'modificada': 'fa-edit'
    };
    return iconos[accion] || 'fa-circle';
  }

  obtenerNivelContribucion(cantidad: number): number {
    if (cantidad === 0) return 0;
    if (cantidad <= 2) return 1;
    if (cantidad <= 4) return 2;
    if (cantidad <= 6) return 3;
    return 4;
  }

  obtenerColorContribucion(nivel: number): string {
    const colores = ['#f5f5f5', '#c6e5d9', '#7fc8a9', '#00875a', '#006644'];
    return colores[nivel] || colores[0];
  }

  tieneInformacionPersonal(): boolean {
    if (!this.usuario) return false;
    return !!(
      this.usuario.bio ||
      this.usuario.cargo ||
      this.usuario.ubicacion ||
      this.usuario.telefono ||
      this.tieneRedesSociales()
    );
  }

  tieneRedesSociales(): boolean {
    if (!this.usuario?.redes_sociales) return false;
    const redes = this.usuario.redes_sociales;
    return !!(redes?.linkedin || redes?.github || redes?.twitter);
  }


abrirConfiguracion() {
  console.log('🔧 Navegando a configuración...');
  
  // Navegar primero a la ruta padre
  this.router.navigate(['/app'], { skipLocationChange: true }).then(() => {
    // Luego a configuración
    this.router.navigate(['/app/configuracion']);
  });
}

  cerrar() {
    console.log('👋 Cerrando modal de perfil');
    // Limpiar query params también
    this.router.navigate(['/app/mi-dia']);
  }


  ngOnDestroy() {
    if (this.chartRendimiento) {
      this.chartRendimiento.destroy();
    }
    if (this.chartCategorias) {
      this.chartCategorias.destroy();
    }
  }
}