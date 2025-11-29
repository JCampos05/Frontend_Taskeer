import { TestBed } from '@angular/core/testing';

import { Compartir } from './compartir';

describe('Compartir', () => {
  let service: Compartir;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Compartir);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
