import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesLista } from './detalles-lista';

describe('DetallesLista', () => {
  let component: DetallesLista;
  let fixture: ComponentFixture<DetallesLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
