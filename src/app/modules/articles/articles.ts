import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ArticlesService } from './services/articles.service';
import { Article } from '../../models/Article';
import { AuthService } from '../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';
import { EditCreateArticleDialog } from './dialogs/edit-create-article-dialog/edit-create-article-dialog';
import { SuppliersService } from '../suppliers/services/suppliers.service';
import { Supplier } from '../../models/Supplier';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-articles',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    ToastModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './articles.html',
  styleUrl: './articles.scss'
})
export class Articles implements OnInit {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  suppliers: Supplier[] = [];
  searchQuery: string = '';

  constructor(
    private articlesService: ArticlesService,
    private authService: AuthService,
    private dialog: MatDialog,
    private messageService: MessageService,
    private supplierService: SuppliersService
  ) { }

  ngOnInit(): void {
    this.articlesService.getAllArticles(this.authService.requireCurrentTenantId()).subscribe(
      a => {
        this.articles = a;
        this.filteredArticles = a;
      }
    )

    this.supplierService.getAllSuppliers(this.authService.requireCurrentTenantId()).subscribe(
      s => this.suppliers = s
    )
  }

  applyFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredArticles = this.articles;
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredArticles = this.articles.filter(article =>
        article.name.toLowerCase().includes(query) ||
        article.unitOfMeasure?.toLowerCase().includes(query) ||
        article.supplier?.name?.toLowerCase().includes(query)
      );
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.filteredArticles = this.articles;
  }

  addArticle() {
    const dialogRef = this.dialog.open(EditCreateArticleDialog, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: { suppliers: this.suppliers }
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.articlesService.createArticle(result)),
      tap((newArticle) => {
        this.showToast('Artikal uspešno kreiran');
        this.articles = [...this.articles, newArticle];
        this.applyFilter();
      }),
      catchError(err => {
        console.error('Error creating article:', err);
        this.showToast('Neuspešno kreiranje artikla', true);
        return EMPTY;
      })
    ).subscribe();
  }

  editArticle(article: Article) {
    const dialogRef = this.dialog.open(EditCreateArticleDialog, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: { article: article, suppliers: this.suppliers }
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.articlesService.updateArticle(article._id!, result)),
      tap((updatedArticle) => {
        this.showToast('Artikal uspešno ažuriran');
        const idx = this.articles.findIndex(a => a._id === article._id);
        if (idx > -1) {
          this.articles[idx] = updatedArticle;
          this.articles = [...this.articles];
        }
        this.applyFilter();
      }),
      catchError(err => {
        console.error('Error updating article:', err);
        this.showToast('Neuspešno ažuriranje artikla', true);
        return EMPTY;
      })
    ).subscribe();
  }

  deleteArticle(article: Article) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: {
        title: 'Brisanje artikla',
        message: `Da li ste sigurni da želite da obrišete ${article.name}?`,
      },
    })

    dialogRef.afterClosed().pipe(
      filter(confirmed => !!confirmed),
      switchMap(() => this.articlesService.deleteArticle(article._id!)),
      tap(() => {
        this.articles = this.articles.filter(a => a._id !== article._id);
        this.applyFilter();
        this.showToast(`Artikal ${article.name} uspešno obrisan`);
      }),
      catchError(err => {
        console.error('Error deleting article', err);
        this.showToast(`Neuspešno brisanje artikla ${article.name}`, true);
        return EMPTY;
      })
    ).subscribe();
  }

  showToast(message: string, isError: boolean = false) {
    this.messageService.add({
      severity: isError ? 'error' : 'success',
      summary: isError ? 'Greška' : 'Uspešno',
      detail: message,
      life: 3000
    });
  }
}
