import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiSemana } from './mi-semana';

describe('MiSemana', () => {
  let component: MiSemana;
  let fixture: ComponentFixture<MiSemana>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiSemana]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiSemana);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
