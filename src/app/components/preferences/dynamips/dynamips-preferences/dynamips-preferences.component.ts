import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Controller } from '@models/controller';
import { ControllerSettingsService } from '@services/controller-settings.service';
import { ControllerService } from '@services/controller.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dynamips-preferences',
  templateUrl: './dynamips-preferences.component.html',
  styleUrls: ['./dynamips-preferences.component.scss'],
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
})
export class DynamipsPreferencesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  dynamipsPath: string;

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();
    });
  }

  restoreDefaults() {
    this.dynamipsPath = '';
  }
}
