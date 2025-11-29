import { Component } from '@angular/core';
import { TableroComponent } from '../../../componentes/principal/tablero/tablero';

@Component({
  selector: 'app-pendientes',
  standalone: true,
  imports: [TableroComponent],
  templateUrl: './pendientes.html',
  styleUrl: './pendientes.css' 
})
export class PendientesComponent  {

}