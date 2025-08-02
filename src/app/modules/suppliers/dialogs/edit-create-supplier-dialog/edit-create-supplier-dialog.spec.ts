import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCreateSupplierDialog } from './edit-create-supplier-dialog';

describe('EditCreateSupplierDialog', () => {
  let component: EditCreateSupplierDialog;
  let fixture: ComponentFixture<EditCreateSupplierDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCreateSupplierDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCreateSupplierDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
