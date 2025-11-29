import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService, Usuario } from '../../../core/services/authentication/authentication';
import { NotificacionesService } from '../../../core/services/notification/notification';
import { CiudadAutocompleteService, Ciudad } from '../../../core/services/ciudad/ciudad';
import { ZonasService, ZonaHoraria } from '../../../core/services/zonas/zonas';

@Component({
  selector: 'app-general',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './general.html',
  styleUrl: './general.css'
})
export class GeneralComponent implements OnInit {
  formGeneral!: FormGroup;
  usuario: Usuario | null = null;
  guardandoGeneral = false;

  // Autocompletado de ciudades
  ciudadesSugeridas: Ciudad[] = [];
  ciudadSeleccionada: Ciudad | null = null;
  mostrarSugerencias = false;
  private busquedaCiudad$ = new Subject<string>();

  // Zonas horarias
  zonasHorarias: ZonaHoraria[] = [];
  zonasAgrupadasPorRegion: { region: string; zonas: ZonaHoraria[] }[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificacionesService: NotificacionesService,
    private ciudadService: CiudadAutocompleteService,
    private zonasService: ZonasService
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
    this.cargarUsuario();
    this.configurarAutocompletado();
    this.cargarZonasHorarias();
  }

  inicializarFormulario() {
    this.formGeneral = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: [''],
      email: [{ value: '', disabled: true }],
      telefono: [''],
      ubicacion: [''],
      zonaHoraria: [''],
      cargo: [''],
      bio: ['', [Validators.maxLength(500)]]
    });
  }

  cargarUsuario() {
    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.llenarFormulario(usuario);
      },
      error: () => {
        const usuarioLocal = this.authService.obtenerUsuarioActual();
        if (usuarioLocal) {
          this.usuario = usuarioLocal;
          this.llenarFormulario(usuarioLocal);
        }
      }
    });
  }

  llenarFormulario(usuario: Usuario) {
    this.formGeneral.patchValue({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      ubicacion: usuario.ubicacion || '',
      zonaHoraria: usuario.zona_horaria || '',
      cargo: usuario.cargo || '',
      bio: usuario.bio || ''
    });
  }

  configurarAutocompletado() {
    this.busquedaCiudad$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.ciudadService.buscarCiudades(query))
    ).subscribe({
      next: (ciudades) => {
        this.ciudadesSugeridas = ciudades;
        this.mostrarSugerencias = ciudades.length > 0;
      },
      error: () => {
        this.ciudadesSugeridas = [];
      }
    });
  }

  cargarZonasHorarias() {
    this.zonasService.obtenerZonasHorarias().subscribe({
      next: (response) => {
        this.zonasHorarias = response.zonas || [];
        this.agruparZonasPorRegion();
      }
    });
  }

  agruparZonasPorRegion() {
    const agrupadas = this.zonasHorarias.reduce((acc, zona) => {
      if (!acc[zona.region]) {
        acc[zona.region] = [];
      }
      acc[zona.region].push(zona);
      return acc;
    }, {} as Record<string, ZonaHoraria[]>);

    this.zonasAgrupadasPorRegion = Object.keys(agrupadas).map(region => ({
      region,
      zonas: agrupadas[region]
    }));
  }

  onCiudadInput(event: any) {
    const query = event.target.value;
    if (query && query.length >= 2) {
      this.busquedaCiudad$.next(query);
      this.ciudadSeleccionada = null;
    } else {
      this.ciudadesSugeridas = [];
      this.mostrarSugerencias = false;
    }
  }

  seleccionarCiudad(ciudad: Ciudad) {
    this.ciudadSeleccionada = ciudad;
    this.formGeneral.patchValue({
      ubicacion: ciudad.nombreCompleto
    });
    this.mostrarSugerencias = false;
    this.ciudadesSugeridas = [];
  }

  ocultarSugerenciasConRetraso() {
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 200);
  }

  async guardarDatosGenerales() {
    if (this.formGeneral.invalid) {
      return;
    }

    this.guardandoGeneral = true;
    const datos = this.formGeneral.getRawValue();

    try {
      await this.authService.actualizarPerfil({
        nombre: datos.nombre,
        apellido:datos.apellido,
        bio: datos.bio,
        telefono: datos.telefono,
        ubicacion: datos.ubicacion,
        cargo: datos.cargo
      }).toPromise();

      if (datos.zonaHoraria && datos.zonaHoraria.trim() !== '') {
        await this.zonasService.actualizarZonaUsuario(datos.zonaHoraria).toPromise();
      }

      this.notificacionesService.mostrar('exito', 'Datos actualizados correctamente');

      if (this.ciudadSeleccionada) {
        window.dispatchEvent(new CustomEvent('ubicacionActualizada', {
          detail: {
            ciudad: this.ciudadSeleccionada.nombre,
            nombreCompleto: this.ciudadSeleccionada.nombreCompleto
          }
        }));
      }

      this.cargarUsuario();
      this.ciudadSeleccionada = null;
    } catch (error: any) {
      const mensaje = error.error?.mensaje || error.error?.error || 'Error al actualizar datos';
      this.notificacionesService.mostrar('error', mensaje);
    } finally {
      this.guardandoGeneral = false;
    }
  }

  cancelarCambios() {
    if (this.usuario) {
      this.llenarFormulario(this.usuario);
    }
    this.formGeneral.markAsPristine();
    this.formGeneral.markAsUntouched();
  }
}