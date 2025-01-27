import { Component } from '@angular/core';

@Component({
  selector: 'app-unauthorized',
  template: `
    <div class="unauthorized">
      <h1>Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <a routerLink="/home" mat-button>Go to Home</a>
    </div>
  `,
  styles: [
    `
      .unauthorized {
        text-align: center;
        margin-top: 50px;
      }
    `,
  ],
})
export class UnauthorizedComponent {}