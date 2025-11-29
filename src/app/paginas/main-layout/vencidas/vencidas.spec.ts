import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vencidas } from './vencidas';

describe('Vencidas', () => {
  let component: Vencidas;
  let fixture: ComponentFixture<Vencidas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vencidas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vencidas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
