import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalNotiUser } from './modal-noti-user';

describe('ModalNotiUser', () => {
  let component: ModalNotiUser;
  let fixture: ComponentFixture<ModalNotiUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalNotiUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalNotiUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
