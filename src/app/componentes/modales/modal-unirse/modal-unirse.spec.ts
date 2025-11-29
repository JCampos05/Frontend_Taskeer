import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalUnirse } from './modal-unirse';

describe('ModalUnirse', () => {
  let component: ModalUnirse;
  let fixture: ComponentFixture<ModalUnirse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalUnirse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalUnirse);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
