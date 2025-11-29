import { TestBed } from '@angular/core/testing';

import { Zonas } from './zonas';

describe('Zonas', () => {
  let service: Zonas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Zonas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
