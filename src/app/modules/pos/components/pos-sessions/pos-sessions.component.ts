import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PosService } from '../../services/pos.service';
import { AuthService } from '../../../../core/services/auth.service';

interface PosSession {
  id: string;
  facility: string;
  employee: string;
  startTime: Date;
  endTime?: Date;
  status: 'open' | 'closed';
  totalSales: number;
  totalAmount: number;
}

@Component({
  selector: 'app-pos-sessions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './pos-sessions.component.html',
  styleUrl: './pos-sessions.component.scss',
  providers: [AuthService, PosService]
})
export class PosSessionsComponent implements OnInit {
  sessions: PosSession[] = [];
  loading = false;
  displayedColumns: string[] = ['facility', 'employee', 'startTime', 'endTime', 'status', 'totalSales', 'totalAmount', 'actions'];

  constructor(
    private posService: PosService,
    @Inject(AuthService) private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const params = {
      tenant: currentUser.tenant,
      status: 'open',
      limit: 50,
      sort: '-openedAt'
    };

    this.posService.getSessions(params).subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.snackBar.open('Greška pri učitavanju sesija', 'Zatvori', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  openNewSession(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const sessionData = {
      facility: '6851ed521d2ae13828e97f89', // Default facility - should be selected
      openingFloat: 0
    };

    this.posService.openSession(sessionData).subscribe({
      next: (session) => {
        this.sessions.unshift(session);
        this.snackBar.open('Sesija uspešno otvorena', 'Zatvori', { duration: 2000 });
        this.loadSessions(); // Refresh the list
      },
      error: (error) => {
        console.error('Error opening session:', error);
        this.snackBar.open('Greška pri otvaranju sesije', 'Zatvori', { duration: 3000 });
      }
    });
  }

  closeSession(session: PosSession): void {
    const closeData = {
      closingCount: 0, // Should be actual count
      note: 'Sesija zatvorena'
    };

    this.posService.closeSession(session.id, closeData).subscribe({
      next: () => {
        this.snackBar.open('Sesija uspešno zatvorena', 'Zatvori', { duration: 2000 });
        this.loadSessions(); // Refresh the list
      },
      error: (error) => {
        console.error('Error closing session:', error);
        this.snackBar.open('Greška pri zatvaranju sesije', 'Zatvori', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: string): string {
    return status === 'open' ? 'primary' : 'warn';
  }

  getStatusText(status: string): string {
    return status === 'open' ? 'Otvorena' : 'Zatvorena';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('sr-RS');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD'
    }).format(amount);
  }
}
