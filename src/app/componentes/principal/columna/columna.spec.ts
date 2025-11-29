import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Columna } from './columna';

describe('Columna', () => {
  let component: Columna;
  let fixture: ComponentFixture<Columna>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Columna]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Columna);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
