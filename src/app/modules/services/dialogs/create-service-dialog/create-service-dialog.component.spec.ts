import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceDialogComponent } from './create-service-dialog.component';

describe('CreateServiceDialogComponent', () => {
  let component: CreateServiceDialogComponent;
  let fixture: ComponentFixture<CreateServiceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServiceDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServiceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
