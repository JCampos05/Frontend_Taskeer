import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCompartir } from './modal-compartir';

describe('ModalCompartir', () => {
  let component: ModalCompartir;
  let fixture: ComponentFixture<ModalCompartir>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCompartir]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCompartir);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
