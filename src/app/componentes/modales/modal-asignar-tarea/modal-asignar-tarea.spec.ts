import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAsignarTarea } from './modal-asignar-tarea';

describe('ModalAsignarTarea', () => {
  let component: ModalAsignarTarea;
  let fixture: ComponentFixture<ModalAsignarTarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAsignarTarea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAsignarTarea);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
