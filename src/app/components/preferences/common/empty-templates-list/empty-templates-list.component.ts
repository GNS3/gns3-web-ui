import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-empty-templates-list',
  templateUrl: './empty-templates-list.component.html',
  styleUrls: ['./empty-templates-list.component.scss'],
  imports: [MatCardModule],
})
export class EmptyTemplatesListComponent {
  @Input() textMessage: string;
  emptyTemplatesListMessage: string = 'Empty templates list';

  constructor() {
    if (this.textMessage) {
      this.emptyTemplatesListMessage = this.textMessage;
    }
  }
}
