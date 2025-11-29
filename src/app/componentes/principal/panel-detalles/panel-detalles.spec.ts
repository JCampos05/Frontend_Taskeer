import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelDetalles } from './panel-detalles';

describe('PanelDetalles', () => {
  let component: PanelDetalles;
  let fixture: ComponentFixture<PanelDetalles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelDetalles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelDetalles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
