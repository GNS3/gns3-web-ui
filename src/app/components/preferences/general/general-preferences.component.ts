import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-general-preferences',
  templateUrl: './general-preferences.component.html',
  styleUrls: ['./general-preferences.component.scss'],
})
export class GeneralPreferencesComponent implements OnInit {
  public controllerId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
  }
}
