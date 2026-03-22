import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-empty-templates-list',
  templateUrl: './empty-templates-list.component.html',
  styleUrl: './empty-templates-list.component.scss',
  imports: [MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyTemplatesListComponent {
  readonly textMessage = input<string>(undefined);
  readonly emptyTemplatesListMessage = computed(() => this.textMessage() ?? 'Empty templates list');
}
