import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownLista } from './dropdown-lista';

describe('DropdownLista', () => {
  let component: DropdownLista;
  let fixture: ComponentFixture<DropdownLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropdownLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
