import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalUsuariosLista } from './modal-usuarios-lista';

describe('ModalUsuariosLista', () => {
  let component: ModalUsuariosLista;
  let fixture: ComponentFixture<ModalUsuariosLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalUsuariosLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalUsuariosLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
