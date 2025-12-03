import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-agent-embed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-embed.component.html',
  styleUrl: './agent-embed.component.scss',
})
export class AgentEmbedComponent implements OnInit, OnDestroy {
  @Input() embedCode!: string;
  @Input() height: string = '600px';

  sanitizedEmbedCode: SafeHtml | null = null;
  isLoading = true;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (this.embedCode) {
      // Sanitize and set embed code
      this.sanitizedEmbedCode = this.sanitizer.bypassSecurityTrustHtml(this.embedCode);
      // Simulate loading delay for better UX
      setTimeout(() => {
        this.isLoading = false;
      }, 500);
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}

