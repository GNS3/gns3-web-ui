import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
})
export class PreferencesComponent implements OnInit {
  public serverId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.serverId = this.route.snapshot.paramMap.get('controller_id');
  }
}
