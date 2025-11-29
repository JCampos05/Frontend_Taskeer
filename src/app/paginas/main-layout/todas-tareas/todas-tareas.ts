import { Component } from '@angular/core';
import { ColumnasComponent } from '../../../componentes/principal/columna/columna';

@Component({
  selector: 'app-todas-tareas',
  standalone: true,
  imports: [ColumnasComponent],
  templateUrl: './todas-tareas.html',
  styleUrl: './todas-tareas.css'
})
export class TodasTareasComponent {
  // Este componente solo renderiza las columnas
  // El ColumnasComponent se encargará de cargar todas las tareas
}