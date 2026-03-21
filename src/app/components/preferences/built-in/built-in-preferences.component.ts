import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  standalone: true,
  selector: 'app-built-in-preferences',
  templateUrl: './built-in-preferences.component.html',
  styleUrls: ['./built-in-preferences.component.scss', '../preferences.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatListModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class BuiltInPreferencesComponent implements OnInit {
  private route = inject(ActivatedRoute);

  readonly controllerId = signal<string>('');

  ngOnInit() {
    this.controllerId.set(this.route.snapshot.paramMap.get('controller_id') ?? '');
  }
}
