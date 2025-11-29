import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListasIndividuales } from './listas-individuales';

describe('ListasIndividuales', () => {
  let component: ListasIndividuales;
  let fixture: ComponentFixture<ListasIndividuales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListasIndividuales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListasIndividuales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
