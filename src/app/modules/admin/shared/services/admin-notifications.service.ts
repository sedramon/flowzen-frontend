import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class AdminNotificationsService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string, config?: MatSnackBarConfig): void {
    this.open(message, ['notification-success'], config);
  }

  error(message: string, config?: MatSnackBarConfig): void {
    this.open(message, ['notification-error'], config);
  }

  info(message: string, config?: MatSnackBarConfig): void {
    this.open(message, ['notification-info'], config);
  }

  private open(message: string, panelClass: string[], config?: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Zatvori', {
      duration: 3500,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass,
      ...config,
    });
  }
}


