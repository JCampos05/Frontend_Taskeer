import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaCompartida } from './lista-compartida';

describe('ListaCompartida', () => {
  let component: ListaCompartida;
  let fixture: ComponentFixture<ListaCompartida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCompartida]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaCompartida);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
