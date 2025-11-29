import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiDia } from './mi-dia';

describe('MiDia', () => {
  let component: MiDia;
  let fixture: ComponentFixture<MiDia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiDia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiDia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
