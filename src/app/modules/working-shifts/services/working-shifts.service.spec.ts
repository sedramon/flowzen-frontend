import { TestBed } from '@angular/core/testing';

import { WorkingShiftsService } from './working-shifts.service';

describe('WorkingShiftsService', () => {
  let service: WorkingShiftsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkingShiftsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
