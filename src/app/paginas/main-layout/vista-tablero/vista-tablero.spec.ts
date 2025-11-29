import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaTablero } from './vista-tablero';

describe('VistaTablero', () => {
  let component: VistaTablero;
  let fixture: ComponentFixture<VistaTablero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaTablero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VistaTablero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
