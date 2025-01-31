import { Component } from '@angular/core';

@Component({
  selector: 'app-unauthorized',
  template: `
    <div class="main-container unauthorized">
      <h1>Access Denied</h1>
      <p>You do not have permission to access this page.</p>
    </div>
  `,
  styles: [
    `
      .unauthorized {
        text-align: center;
      }
    `,
  ],
})
export class UnauthorizedComponent {}