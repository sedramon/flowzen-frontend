import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit, 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ServicesService } from './services/services.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../models/Service';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule
  ],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  animations: [
  ]
})
export class ServicesComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSourceServices = new MatTableDataSource<Service>([]);
  displayedColumnsServices: string[] = ['name', 'price', 'durationMinutes', 'actions'];

  searchQuery: string = '';

  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
    @ViewChild('servicesSort')
    set servicesSort(ms: MatSort) {
      if (ms) {
        this.dataSourceServices.sort = ms;
      }
    }



  constructor(
    private servicesService: ServicesService,
    private authService : AuthService,
    private snackBar: MatSnackBar
  ) {}
  

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }

    this.servicesService.getAllServices(currentUser.tenant).subscribe(services => {
      this.dataSourceServices.data = services;

      this.dataSourceServices.filterPredicate = (data: Service) => {
        const matchesName = data.name.toLowerCase().includes(this.searchQuery.toLowerCase());

        return matchesName;
      }
    });

  }

  ngAfterViewInit(): void {
    if(this.paginators.length) {
      this.dataSourceServices.paginator = this.paginators.first;
    }
  }

  ngOnDestroy() {
    
  }

  applyFilter() {
    this.dataSourceServices.filter = '' + Math.random();
  }

  clearFilters() {
    this.searchQuery = '';
    this.applyFilter();
  }

  showSnackbar(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // 3 seconds
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: isError ? ['snackbar-error'] : ['snackbar-success'] // Ensure it's an array
    });
  }

}
