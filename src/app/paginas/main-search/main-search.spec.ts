import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainSearch } from './main-search';

describe('MainSearch', () => {
  let component: MainSearch;
  let fixture: ComponentFixture<MainSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
