import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalUsuariosCat } from './modal-usuarios-cat';

describe('ModalUsuariosCat', () => {
  let component: ModalUsuariosCat;
  let fixture: ComponentFixture<ModalUsuariosCat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalUsuariosCat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalUsuariosCat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
