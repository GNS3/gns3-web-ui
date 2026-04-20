import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-general-preferences',
  templateUrl: './general-preferences.component.html',
  styleUrl: './general-preferences.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralPreferencesComponent implements OnInit {
  private route = inject(ActivatedRoute);

  public controllerId: string = '';

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
  }
}
