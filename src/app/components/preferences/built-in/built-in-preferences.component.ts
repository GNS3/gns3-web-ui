import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-built-in-preferences',
  templateUrl: './built-in-preferences.component.html',
  styleUrl: './built-in-preferences.component.scss',
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuiltInPreferencesComponent implements OnInit {
  private route = inject(ActivatedRoute);

  readonly controllerId = signal<string>('');

  ngOnInit() {
    this.controllerId.set(this.route.snapshot.paramMap.get('controller_id') ?? '');
  }
}
