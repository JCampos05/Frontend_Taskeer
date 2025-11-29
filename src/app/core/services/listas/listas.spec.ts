import { TestBed } from '@angular/core/testing';

import { Listas } from './listas';

describe('Listas', () => {
  let service: Listas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Listas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
