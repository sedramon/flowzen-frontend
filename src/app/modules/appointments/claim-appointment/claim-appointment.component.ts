import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentsService } from '../services/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-claim-appointment',
  templateUrl: './claim-appointment.component.html',
  styleUrls: ['./claim-appointment.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class ClaimAppointmentComponent implements OnInit {
  claimToken: string = '';
  isLoading: boolean = false;
  isSuccess: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentsService: AppointmentsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.claimToken = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.claimToken) {
      this.errorMessage = 'Invalid claim token';
      return;
    }

    this.claimAppointment();
  }

  claimAppointment(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentsService.claimAppointmentFromWaitlist(this.claimToken, '').subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSuccess = true;
        
        this.snackBar.open('✅ Termin je uspešno prihvaćen!', 'Zatvori', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });

        // Redirect to client login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/client-login']);
        }, 3000);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Greška pri prihvatanju termina';
        
        this.snackBar.open('❌ ' + this.errorMessage, 'Zatvori', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/client-login']);
  }
}
