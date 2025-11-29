import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalLista } from './modal-lista';

describe('ModalLista', () => {
  let component: ModalLista;
  let fixture: ComponentFixture<ModalLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
