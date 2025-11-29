import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnaTablero } from './columna-tablero';

describe('ColumnaTablero', () => {
  let component: ColumnaTablero;
  let fixture: ComponentFixture<ColumnaTablero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnaTablero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColumnaTablero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
