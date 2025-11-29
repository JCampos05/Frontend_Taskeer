import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperatorSection } from './operator-section';

describe('OperatorSection', () => {
  let component: OperatorSection;
  let fixture: ComponentFixture<OperatorSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperatorSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
