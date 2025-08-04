import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEditFacilityDialog } from './create-edit-facility-dialog';

describe('CreateEditFacilityDialog', () => {
  let component: CreateEditFacilityDialog;
  let fixture: ComponentFixture<CreateEditFacilityDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEditFacilityDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEditFacilityDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
