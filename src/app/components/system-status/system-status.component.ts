import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StatusInfoComponent } from './status-info/status-info.component';

@Component({
  standalone: true,
  selector: 'app-system-status',
  templateUrl: './system-status.component.html',
  styleUrls: ['./system-status.component.scss'],
  imports: [StatusInfoComponent],
})
export class SystemStatusComponent implements OnInit {
  public controllerId: string = '';

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
  }
}
