import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPageComponent {
  
  constructor(private router: Router) {}

  onComenzar() {
    console.log('onComenzar ejecutado'); 
    this.router.navigate(['/login']);
  }

  onSolicitarDemo() {
    console.log('Solicitar demo');
    // TODO: Implementar modal o formulario de demo
    //alert('Funcionalidad de demo pendiente. Por ahora te redirigiremos al login.');
    this.router.navigate(['/login']);
  }
}