import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: 'landing', loadComponent: () => import('./paginas/landing-page/landing-page').then(m => m.LandingPageComponent)},
    {path: 'login', loadComponent: () => import('./authentication/login/login').then(m => m.LoginComponent)},
    {path: 'registrate', loadComponent: () => import('./authentication/crear-cuenta/crear-cuenta').then(m => m.Registrate)},
    {path: 'verificar-email', loadComponent: () => import('./authentication/verificar-email/verificar-email').then(m => m.VerificarEmailComponent)},
    {path: 'recuperar-password', loadComponent: () => import('./authentication/recuperar-password/recuperar-password').then(m => m.RecuperarPasswordComponent)},
    {path: 'verificar-recuperacion' , loadComponent: () => import('./authentication/verificar-recuperacion/verificar-recuperacion').then(m => m.VerificarRecuperacionComponent)},
    {path: 'nueva-password' , loadComponent: () => import('./authentication/nueva-password/nueva-password').then(m => m.NuevaPasswordComponent)},
    {path: 'app', loadComponent: () => import('./paginas/main-layout/main-layout').then(m => m.MainLayoutComponent),
        children: [
            {path: '', redirectTo: 'mi-dia', pathMatch: 'full'},
            {path: 'buscar' , loadComponent: () => import('./paginas/main-search/main-search').then(m => m.MainSearchComponent)},
            {path: 'mi-dia', loadComponent: () => import('./paginas/main-layout/mi-dia/mi-dia').then(m =>m.MiDiaComponent)},
            {path: 'mi-semana' , loadComponent: () => import('./paginas/main-layout/mi-semana/mi-semana').then(m => m.MiSemanaComponent)},
            {path: 'todas-tareas', loadComponent: () => import('./paginas/main-layout/todas-tareas/todas-tareas').then(m => m.TodasTareasComponent)},
            {path: 'pendientes', loadComponent: () => import('./paginas/main-layout/pendientes/pendientes').then(m => m.PendientesComponent)},
            {path: 'progreso', loadComponent: () => import('./paginas/main-layout/progreso/progreso').then(m => m.ProgresoComponent)},
            {path: 'completadas', loadComponent: () => import('./paginas/main-layout/completadas/completadas').then(m => m.CompletadasComponent)},
            {path: 'vencidas', loadComponent: () => import('./paginas/main-layout/vencidas/vencidas').then(m => m.VencidasComponent)},
            {path: 'listas-individuales' , loadComponent: () => import('./paginas/main-layout/listas-individuales/listas-individuales').then(m =>m.ListasIndividualesComponent)},
            {path: 'listas-importantes' , loadComponent: () => import('./paginas/main-layout/listas-importantes/listas-importantes').then(m => m.ListasImportantesComponent)},
            {path: 'compartida/:id', loadComponent: () => import('./paginas/lista-compartida/lista-compartida').then(m => m.ListaCompartidaComponent)},
            {path: 'lista/:id', loadComponent: () => import('./paginas/main-layout/detalles-lista/detalles-lista').then(m => m.DetalleListaComponent)},
            {path: 'calendar', loadComponent: () => import('./paginas/main-layout/calendario/calendario').then(m =>m.CalendarioComponent)},
            {path: 'notas', loadComponent: () => import('./paginas/vista-notas/v-notas').then(m => m.NotasComponent)},
            {path: 'tablero/:id', loadComponent: () => import('./paginas/main-layout/vista-tablero/vista-tablero').then(m => m.VistaTableroComponent)},
            {path: 'mi-perfil' , loadComponent: () => import('./paginas/mi-perfil/mi-perfil').then(m => m.MiPerfilComponent)},
            {path: 'configuracion' , loadComponent: () => import('./paginas/configuracion/configuracion').then(m => m.ConfiguracionComponent)}
        ]
    },
    {path: '', redirectTo: 'landing', pathMatch: 'full'},
    {path: '**', redirectTo: 'landing'}
];