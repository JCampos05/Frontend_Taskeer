import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Lista } from '../../../core/services/listas/listas';

@Component({
  selector: 'app-dropdown-lista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-lista.html',
  styleUrl: './dropdown-lista.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownListaComponent),
      multi: true
    }
  ]
})
export class DropdownListaComponent implements ControlValueAccessor {
  @Input() listas: Lista[] = [];
  @Input() placeholder: string = 'Seleccionar lista';
  
  abierto = false;
  valorSeleccionado: number | null = null;
  
  // ControlValueAccessor
  onChange: any = () => {};
  onTouched: any = () => {};

  get listaSeleccionada(): Lista | null {
    if (!this.valorSeleccionado) return null;
    return this.listas.find(l => l.idLista === this.valorSeleccionado) || null;
  }

  toggleDropdown() {
    this.abierto = !this.abierto;
  }

  seleccionarLista(idLista: number | null) {
    this.valorSeleccionado = idLista;
    this.onChange(idLista);
    this.onTouched();
    this.abierto = false;
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    return !icono.trim().startsWith('fa');
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-list';
    }

    const iconoLimpio = icono.trim();

    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    return 'fas fa-list';
  }

  // Implementación de ControlValueAccessor
  writeValue(value: any): void {
    this.valorSeleccionado = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}