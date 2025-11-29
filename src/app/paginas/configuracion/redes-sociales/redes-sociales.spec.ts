import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedesSociales } from './redes-sociales';

describe('RedesSociales', () => {
  let component: RedesSociales;
  let fixture: ComponentFixture<RedesSociales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedesSociales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedesSociales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
