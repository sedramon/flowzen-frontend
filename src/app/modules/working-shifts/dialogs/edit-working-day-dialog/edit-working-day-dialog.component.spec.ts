import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWorkingDayDialogComponent } from './edit-working-day-dialog.component';

describe('EditWorkingDayDialogComponent', () => {
  let component: EditWorkingDayDialogComponent;
  let fixture: ComponentFixture<EditWorkingDayDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditWorkingDayDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditWorkingDayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
