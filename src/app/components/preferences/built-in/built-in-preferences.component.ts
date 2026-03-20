import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-built-in-preferences',
  templateUrl: './built-in-preferences.component.html',
  styleUrls: ['./built-in-preferences.component.scss', '../preferences.component.scss'],
})
export class BuiltInPreferencesComponent implements OnInit {
  public controllerId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
  }
}
