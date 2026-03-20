import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';

@Component({
  standalone: true,
  selector: 'app-stop-capture-action',
  templateUrl: './stop-capture-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class StopCaptureActionComponent {
  private linkService = inject(LinkService);

  @Input() controller: Controller;
  @Input() link: Link;

  stopCapture() {
    this.linkService.stopCaptureOnLink(this.controller, this.link).subscribe(() => {});
  }
}
