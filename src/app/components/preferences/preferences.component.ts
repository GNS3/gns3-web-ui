import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss',
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesComponent implements OnInit {
  public controllerId: string = '';

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
  }
}
