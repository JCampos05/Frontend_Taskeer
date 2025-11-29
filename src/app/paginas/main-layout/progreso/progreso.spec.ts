import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Progreso } from './progreso';

describe('Progreso', () => {
  let component: Progreso;
  let fixture: ComponentFixture<Progreso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Progreso]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Progreso);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
