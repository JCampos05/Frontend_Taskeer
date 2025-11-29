import { TestBed } from '@angular/core/testing';

import { NotiUserInterceptor } from './noti-user-interceptor';

describe('NotiUserInterceptor', () => {
  let service: NotiUserInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotiUserInterceptor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
