import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditShiftDialogComponent } from './edit-shift-dialog.component';

describe('EditShiftDialogComponent', () => {
  let component: EditShiftDialogComponent;
  let fixture: ComponentFixture<EditShiftDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditShiftDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditShiftDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
