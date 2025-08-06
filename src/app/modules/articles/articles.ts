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
  displayedColumnsArticles = ['name', 'unitOfMeasure', 'price', 'isActive', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private articlesService: ArticlesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.articlesService.getAllArticles(this.authService.getCurrentUser()!.tenant).subscribe(
      a => this.dataSourceArticles.data = a
    )
  }

  ngAfterViewInit(): void {
    this.dataSourceArticles.paginator = this.paginator;
    this.dataSourceArticles.sort = this.sort;
  }

  addArticle() {}

  editArticle() {}

  deleteArticle() {}
}
