import { TestBed } from '@angular/core/testing';

import { NotificationUser } from './notification-user';

describe('NotificationUser', () => {
  let service: NotificationUser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationUser);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
