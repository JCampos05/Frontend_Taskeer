import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPerfilUsuario } from './modal-perfil-usuario';

describe('ModalPerfilUsuario', () => {
  let component: ModalPerfilUsuario;
  let fixture: ComponentFixture<ModalPerfilUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPerfilUsuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPerfilUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
