import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListasImportantes } from './listas-importantes';

describe('ListasImportantes', () => {
  let component: ListasImportantes;
  let fixture: ComponentFixture<ListasImportantes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListasImportantes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListasImportantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
