import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  standalone: true,
  selector: 'app-built-in-preferences',
  templateUrl: './built-in-preferences.component.html',
  styleUrls: ['./built-in-preferences.component.scss', '../preferences.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatListModule]
})
export class BuiltInPreferencesComponent implements OnInit {
  private route = inject(ActivatedRoute);

  public controllerId: string = '';

  ngOnInit() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
  }
}
