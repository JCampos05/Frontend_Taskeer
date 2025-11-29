import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEliminarTarea } from './modal-eliminar-tarea';

describe('ModalEliminarTarea', () => {
  let component: ModalEliminarTarea;
  let fixture: ComponentFixture<ModalEliminarTarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEliminarTarea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalEliminarTarea);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
