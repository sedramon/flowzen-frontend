import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ArticlesService } from './services/articles.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Article } from '../../models/Article';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthService } from '../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditCreateArticleDialog } from './dialogs/edit-create-article-dialog/edit-create-article-dialog';
import { SuppliersService } from '../suppliers/services/suppliers.service';
import { Supplier } from '../../models/Supplier';

@Component({
  selector: 'app-articles',
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule
  ],
  templateUrl: './articles.html',
  styleUrl: './articles.scss'
})
export class Articles implements OnInit, AfterViewInit {
  dataSourceArticles = new MatTableDataSource<Article>([]);
  displayedColumnsArticles = ['name', 'unitOfMeasure', 'price', 'salePrice', 'isOnSale', 'taxRates', 'supplier', 'isActive', 'actions'];

  suppliers: Supplier[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private articlesService: ArticlesService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private supplierService: SuppliersService
  ) { }

  ngOnInit(): void {
    this.articlesService.getAllArticles(this.authService.getCurrentUser()!.tenant!).subscribe(
      a => this.dataSourceArticles.data = a
    )

    this.supplierService.getAllSuppliers(this.authService.getCurrentUser()!.tenant!).subscribe(
      s => this.suppliers = s
    )
  }

  ngAfterViewInit(): void {
    this.dataSourceArticles.paginator = this.paginator;
    this.dataSourceArticles.sort = this.sort;
  }

  addArticle() {
    const dialogRef = this.dialog.open(EditCreateArticleDialog, {
      width: 'min(800px, 90vw)',          // never wider than 800px or 90% viewport
      maxWidth: '90vw',
      maxHeight: '90vh',                  // prevent vertical overflow
      data: { suppliers: this.suppliers }
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.articlesService.createArticle(result)),
      tap((newArticle) => {
        this.snackBar.open('Article created succesfully', 'Okay', { duration: 2000 });
        this.dataSourceArticles.data = [
          ...this.dataSourceArticles.data,
          newArticle
        ]
      }),
      catchError(err => {
        console.error('Error creating article:', err);
        this.snackBar.open('Failed to create article', 'Okay', { duration: 2000 });
        return EMPTY;
      })
    ).subscribe();
  }

  editArticle(article: Article) {
    const dialogRef = this.dialog.open(EditCreateArticleDialog, {
      width: '800px',
      data: { article: article, suppliers: this.suppliers }
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.articlesService.updateArticle(article._id!, result)),
      tap((updateArticle) => {
        this.snackBar.open('Article update succesfully', 'Okay', { duration: 2000 })
        this.dataSourceArticles.data = this.dataSourceArticles.data.map(a => a._id === article._id ? updateArticle : a);
      }),
      catchError(err => {
        console.error('Error updating article:', err);
        this.snackBar.open('Failed to update article', 'Okay', { duration: 2000 });
        return EMPTY;
      })
    ).subscribe();
  }

  deleteArticle(article: Article) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '250px',
      data: {
        title: 'Delete Facility',
        message: `Are you sure you want to delete ${article.name}?`,
      },
    })

    dialogRef.afterClosed().pipe(
      filter(confirmed => !!confirmed),
      switchMap(() => this.articlesService.deleteArticle(article._id!)),
      tap(() => {
        this.dataSourceArticles.data = this.dataSourceArticles.data.filter(a => a._id !== article._id)
        this.snackBar.open(`Article ${article.name} deleted succesfully`, 'Okay', { duration: 2000 });
      }),
      catchError(err => {
        console.error('Error deleting service', err)
        this.snackBar.open(`Failed to delete ${article.name} service`, 'Okay', { duration: 2000 });
        return EMPTY;
      })
    ).subscribe();
  }
}
