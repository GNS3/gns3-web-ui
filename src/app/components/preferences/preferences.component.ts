import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
})
export class PreferencesComponent implements OnInit {
  public controllerId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
  }
}
