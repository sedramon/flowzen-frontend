import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCreateArticleDialog } from './edit-create-article-dialog';

describe('EditCreateArticleDialog', () => {
  let component: EditCreateArticleDialog;
  let fixture: ComponentFixture<EditCreateArticleDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCreateArticleDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCreateArticleDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
