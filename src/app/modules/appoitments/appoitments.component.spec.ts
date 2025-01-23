import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppoitmentsComponent } from './appoitments.component';

describe('AppoitmentsComponent', () => {
  let component: AppoitmentsComponent;
  let fixture: ComponentFixture<AppoitmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppoitmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppoitmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
