import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-general-preferences',
  templateUrl: './general-preferences.component.html',
  styleUrls: ['./general-preferences.component.scss'],
})
export class GeneralPreferencesComponent implements OnInit {
  public serverId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.serverId = this.route.snapshot.paramMap.get('server_id');
  }
}
