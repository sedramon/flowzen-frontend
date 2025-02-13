import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRoleDialogComponent } from './add-role-dialog.component';

describe('AddRoleDialogComponent', () => {
  let component: AddRoleDialogComponent;
  let fixture: ComponentFixture<AddRoleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRoleDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
