import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-empty-templates-list',
  templateUrl: './empty-templates-list.component.html',
  styleUrls: ['./empty-templates-list.component.scss'],
  imports: [MatCardModule],
})
export class EmptyTemplatesListComponent {
  readonly textMessage = input<string>(undefined);
  emptyTemplatesListMessage: string = 'Empty templates list';

  constructor() {
    const textMessage = this.textMessage();
    if (textMessage) {
      this.emptyTemplatesListMessage = textMessage;
    }
  }
}
