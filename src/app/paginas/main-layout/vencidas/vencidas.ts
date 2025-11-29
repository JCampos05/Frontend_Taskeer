import { Component } from '@angular/core';
import { TableroComponent } from '../../../componentes/principal/tablero/tablero';

@Component({
  selector: 'app-vencidas',
  standalone: true,
  imports: [TableroComponent],
  templateUrl: './vencidas.html',
  styleUrl: './vencidas.css' 
})
export class VencidasComponent {
}