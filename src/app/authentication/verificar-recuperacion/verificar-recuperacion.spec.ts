import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificarRecuperacion } from './verificar-recuperacion';

describe('VerificarRecuperacion', () => {
  let component: VerificarRecuperacion;
  let fixture: ComponentFixture<VerificarRecuperacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificarRecuperacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificarRecuperacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
