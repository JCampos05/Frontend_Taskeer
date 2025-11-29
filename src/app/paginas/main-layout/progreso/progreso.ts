import { Component } from '@angular/core';
import { TableroComponent } from '../../../componentes/principal/tablero/tablero';

@Component({
  selector: 'app-progreso',
  standalone: true,
  imports: [TableroComponent],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css'
})
export class ProgresoComponent {
}