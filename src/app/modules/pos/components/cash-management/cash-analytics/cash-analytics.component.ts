import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Facility } from '../../../../../models/Facility';
import { PosService } from '../../../services/pos.service';

@Component({
  selector: 'app-cash-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  templateUrl: './cash-analytics.component.html',
  styleUrls: ['./cash-analytics.component.scss']
})
export class CashAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  analyticsData: any = null;
  facilities: Facility[] = [];
  
  // Loading states
  loading = true;
  analyticsLoading = false;
  
  // Form
  analyticsForm: FormGroup;
  
  // Chart data (mock for now) - REMOVED PAYMENT METHODS TO AVOID CONFUSION
  chartData = {
    dailyVariance: [
      { date: '2024-01-01', variance: 150 },
      { date: '2024-01-02', variance: -75 },
      { date: '2024-01-03', variance: 200 },
      { date: '2024-01-04', variance: -50 },
      { date: '2024-01-05', variance: 100 }
    ],
    // REMOVED: paymentMethods - these were causing confusion with real data
    sessionTrends: [
      { date: '2024-01-01', sessions: 5, totalCash: 25000 },
      { date: '2024-01-02', sessions: 3, totalCash: 18000 },
      { date: '2024-01-03', sessions: 7, totalCash: 32000 },
      { date: '2024-01-04', sessions: 4, totalCash: 22000 },
      { date: '2024-01-05', sessions: 6, totalCash: 28000 }
    ]
  };

  constructor(
    private posService: PosService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.analyticsForm = this.fb.group({
      facility: [''],
      period: ['week'],
      startDate: [new Date()],
      endDate: [new Date()]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Učitava početne podatke
   */
  private loadInitialData(): void {
    this.loading = true;
    
    // Set default facility
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const defaultFacility = '68d855f9f07f767dc2582ba2'; // Test Facility
    
    this.analyticsForm.patchValue({
      facility: defaultFacility,
      period: 'week',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date()
    });
    
    this.posService.getFacilities(currentUser?.tenant)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facilities) => {
          this.facilities = facilities;
          if (facilities.length > 0 && !this.analyticsForm.get('facility')?.value) {
            this.analyticsForm.patchValue({ facility: facilities[0]._id });
          }
          this.loadAnalytics();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading facilities:', error);
          this.snackBar.open('Greška pri učitavanju objekata', 'Zatvori', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  /**
   * Učitava analytics podatke
   */
  private loadAnalytics(): void {
    this.analyticsLoading = true;
    
    const facility = this.analyticsForm.get('facility')?.value;
    const startDate = this.analyticsForm.get('startDate')?.value;
    const endDate = this.analyticsForm.get('endDate')?.value;
    
    if (!facility) {
      this.analyticsLoading = false;
      return;
    }

    // Load real data from multiple endpoints
    const requests = [
      this.posService.getSessions({ 
        status: 'closed', 
        facility: facility 
      }),
      this.posService.getDailyCashReport(facility, startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0])
    ];

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const sessions = results[0] as any[];
          const dailyReport = results[1];
          this.calculateAnalytics(sessions, dailyReport);
          this.analyticsLoading = false;
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.snackBar.open('Greška pri učitavanju analytics podataka', 'Zatvori', { duration: 3000 });
          
          // Set empty state
          this.analyticsData = {
            totalSessions: 0,
            totalCash: 0,
            averageVariance: 0,
            averageTransactionValue: 0,
            varianceTrend: 'stable',
            topPerformingFacility: 'N/A',
            cashFlowEfficiency: 0,
            recommendations: ['Greška pri učitavanju podataka'],
            paymentMethods: []
          };
          
          this.analyticsLoading = false;
        }
      });
  }

  /**
   * Kalkuliše analytics podatke
   */
  private calculateAnalytics(sessions: any[], dailyReport: any): void {
    const totalSessions = sessions?.length || 0;
    
    // Calculate total cash from sessions data (more reliable than daily report)
    const totalCashFromSessions = sessions?.reduce((sum: number, session: any) => {
      const sessionCash = session.expectedCash || session.totalsByMethod?.cash || 0;
      return sum + sessionCash;
    }, 0) || 0;
    
    // Also try daily report as fallback
    const paymentTotals = dailyReport?.totalsByMethod || dailyReport?.paymentTotals || {};
    const totalPaymentAmount = Object.values(paymentTotals).reduce((sum: number, amount: any) => sum + (amount || 0), 0);
    const totalCashFromSummary = dailyReport?.summary?.totalExpectedCash || dailyReport?.summary?.totalActualCash || 0;
    
    // Use sessions data first, then daily report as fallback
    const totalCash = totalCashFromSessions || totalCashFromSummary || totalPaymentAmount || 0;
    
    // Calculate variance
    const totalVariance = sessions?.reduce((sum, session) => {
      const variance = session.variance || 0;
      return sum + Math.abs(variance);
    }, 0) || 0;
    
    const averageVariance = totalSessions > 0 ? (totalVariance / totalSessions) : 0;
    
    // Calculate average transaction value
    const averageTransactionValue = totalSessions > 0 ? totalCash / totalSessions : 0;
    
    // If no real data, show empty state
    if (totalSessions === 0 || totalCash === 0) {
      this.analyticsData = {
        totalSessions: 0,
        totalCash: 0,
        averageVariance: 0,
        averageTransactionValue: 0,
        varianceTrend: 'stable',
        topPerformingFacility: 'N/A',
        cashFlowEfficiency: 0,
        recommendations: ['Nema podataka za prikazani period'],
        paymentMethods: []
      };
      return;
    }
    
    this.analyticsData = {
      totalSessions,
      totalCash,
      averageVariance: Math.round(averageVariance * 100) / 100,
      averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
      varianceTrend: averageVariance < 100 ? 'improving' : 'needs_attention',
      topPerformingFacility: this.getFacilityName(this.analyticsForm.get('facility')?.value),
      cashFlowEfficiency: totalSessions > 0 ? Math.round((totalCash / totalSessions) / 1000 * 100) : 0,
      recommendations: this.generateRecommendations(averageVariance, totalSessions),
      paymentMethods: this.calculatePaymentMethodsFromSessions(sessions, totalCash)
    };
  }

  /**
   * Kalkuliše payment methods iz sessions podataka
   */
  private calculatePaymentMethodsFromSessions(sessions: any[], totalAmount: number): Array<{method: string, amount: number, percentage: number}> {
    const methods: Array<{method: string, amount: number, percentage: number}> = [];
    
    if (sessions && sessions.length > 0 && totalAmount > 0) {
      // Sum up payment methods from all sessions
      const totalsByMethod = sessions.reduce((totals: any, session: any) => {
        const sessionTotals = session.totalsByMethod || {};
        
        return {
          cash: (totals.cash || 0) + (sessionTotals.cash || 0),
          card: (totals.card || 0) + (sessionTotals.card || 0),
          voucher: (totals.voucher || 0) + (sessionTotals.voucher || 0),
          gift: (totals.gift || 0) + (sessionTotals.gift || 0),
          bank: (totals.bank || 0) + (sessionTotals.bank || 0),
          other: (totals.other || 0) + (sessionTotals.other || 0)
        };
      }, {});
      
      // Create payment method objects
      Object.entries(totalsByMethod).forEach(([method, amount]) => {
        const amountValue = amount as number;
        if (amountValue > 0) {
          methods.push({
            method,
            amount: amountValue,
            percentage: Math.round((amountValue / totalAmount) * 100)
          });
        }
      });
    }
    
    return methods;
  }

  /**
   * Kalkuliše payment methods (legacy method for daily report)
   */
  private calculatePaymentMethods(paymentTotals: any, totalAmount: number): Array<{method: string, amount: number, percentage: number}> {
    const methods: Array<{method: string, amount: number, percentage: number}> = [];
    
    // If we have real payment data, use it
    if (paymentTotals && Object.keys(paymentTotals).length > 0 && totalAmount > 0) {
      // Try different possible field names
      const cashAmount = paymentTotals.cash || paymentTotals.CASH || paymentTotals.gotovina || 0;
      const cardAmount = paymentTotals.card || paymentTotals.CARD || paymentTotals.kartica || 0;
      const voucherAmount = paymentTotals.voucher || paymentTotals.VOUCHER || paymentTotals.vaučer || 0;
      
      if (cashAmount > 0) {
        methods.push({
          method: 'cash',
          amount: cashAmount,
          percentage: Math.round((cashAmount / totalAmount) * 100)
        });
      }
      
      if (cardAmount > 0) {
        methods.push({
          method: 'card',
          amount: cardAmount,
          percentage: Math.round((cardAmount / totalAmount) * 100)
        });
      }
      
      if (voucherAmount > 0) {
        methods.push({
          method: 'voucher',
          amount: voucherAmount,
          percentage: Math.round((voucherAmount / totalAmount) * 100)
        });
      }
    }
    
    return methods;
  }

  /**
   * Generiše preporuke
   */
  private generateRecommendations(averageVariance: number, totalSessions: number): string[] {
    const recommendations = [];
    
    if (averageVariance > 500) {
      recommendations.push('Variance je visoka - preporučuje se redovno brojanje cash-a');
    } else {
      recommendations.push('Variance je u prihvatljivim granicama');
    }
    
    if (totalSessions < 5) {
      recommendations.push('Mali broj sesija - razmotrite povećanje aktivnosti');
    }
    
    recommendations.push('Redovno praćenje cash flow-a je ključno za uspeh');
    
    return recommendations;
  }

  /**
   * Učitava mock podatke kao fallback (REMOVED - no longer used)
   */
   // private loadMockAnalytics(): void {
   //   // REMOVED: Mock data was causing incorrect 125,000 RSD values
   //   // Now using empty state instead of mock data
   // }

  /**
   * Generiše analytics izveštaj
   */
  generateAnalytics(): void {
    this.loadAnalytics();
    this.snackBar.open('Analytics uspešno generisan', 'Zatvori', { duration: 2000 });
  }

  /**
   * Handler za promenu filtera
   */
  onFilterChange(): void {
    this.loadAnalytics();
  }

  /**
   * Vraća ime facility-ja
   */
  private getFacilityName(facilityId: string): string {
    const facility = this.facilities.find(f => f._id === facilityId);
    return facility?.name || 'N/A';
  }

  /**
   * Eksportuje analytics podatke
   */
  exportAnalytics(): void {
    if (!this.analyticsData) {
      this.snackBar.open('Nema podataka za eksport', 'Zatvori', { duration: 3000 });
      return;
    }

    // TODO: Implement export functionality
    this.snackBar.open('Eksport funkcionalnost će biti implementirana', 'Zatvori', { duration: 2000 });
  }

  /**
   * Formatira iznos za prikaz
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Vraća boju za trend
   */
  getTrendColor(trend: string): 'primary' | 'accent' | 'warn' {
    switch (trend) {
      case 'improving': return 'primary';
      case 'stable': return 'accent';
      case 'declining': return 'warn';
      default: return 'primary';
    }
  }

  /**
   * Vraća ikonu za trend
   */
  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'improving': return 'trending_up';
      case 'stable': return 'trending_flat';
      case 'declining': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  /**
   * Vraća tekst za trend
   */
  getTrendText(trend: string): string {
    switch (trend) {
      case 'improving': return 'U poboljšanju';
      case 'stable': return 'Stabilno';
      case 'declining': return 'U opadanju';
      default: return 'Nepoznato';
    }
  }

  /**
   * Vraća boju za payment method
   */
  getPaymentMethodColor(method: string): 'primary' | 'accent' | 'warn' {
    switch (method) {
      case 'cash': return 'primary';
      case 'card': return 'accent';
      case 'voucher': return 'warn';
      default: return 'primary';
    }
  }

  /**
   * Vraća ikonu za payment method
   */
  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'cash': return 'attach_money';
      case 'card': return 'credit_card';
      case 'voucher': return 'confirmation_number';
      case 'gift': return 'card_giftcard';
      case 'bank': return 'account_balance';
      default: return 'payment';
    }
  }

  /**
   * Vraća tekst za payment method
   */
  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'cash': return 'Gotovina';
      case 'card': return 'Kartica';
      case 'voucher': return 'Vaučer';
      case 'gift': return 'Poklon';
      case 'bank': return 'Bankovni';
      case 'other': return 'Ostalo';
      default: return method;
    }
  }
}
