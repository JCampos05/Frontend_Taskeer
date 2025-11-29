import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Completadas } from './completadas';

describe('Completadas', () => {
  let component: Completadas;
  let fixture: ComponentFixture<Completadas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Completadas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Completadas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
