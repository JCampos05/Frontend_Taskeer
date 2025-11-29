import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodasTareas } from './todas-tareas';

describe('TodasTareas', () => {
  let component: TodasTareas;
  let fixture: ComponentFixture<TodasTareas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodasTareas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TodasTareas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
