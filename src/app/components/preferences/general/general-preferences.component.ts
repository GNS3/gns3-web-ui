import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-general-preferences',
  templateUrl: './general-preferences.component.html',
  styleUrls: ['./general-preferences.component.scss'],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class GeneralPreferencesComponent implements OnInit {
  private route = inject(ActivatedRoute);

  public controllerId: string = '';

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
  }
}
