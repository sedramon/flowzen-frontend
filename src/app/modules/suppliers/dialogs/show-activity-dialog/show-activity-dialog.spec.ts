import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowActivityDialog } from './show-activity-dialog';

describe('ShowActivityDialog', () => {
  let component: ShowActivityDialog;
  let fixture: ComponentFixture<ShowActivityDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowActivityDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowActivityDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
