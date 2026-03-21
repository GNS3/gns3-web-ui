import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-empty-templates-list',
  templateUrl: './empty-templates-list.component.html',
  styleUrls: ['./empty-templates-list.component.scss'],
  imports: [MatCardModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class EmptyTemplatesListComponent {
  readonly textMessage = input<string>(undefined);
  readonly emptyTemplatesListMessage = computed(() => this.textMessage() ?? 'Empty templates list');
}
