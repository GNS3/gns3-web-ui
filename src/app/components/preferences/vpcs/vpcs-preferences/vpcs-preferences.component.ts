import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vpcs-preferences',
  templateUrl: './vpcs-preferences.component.html',
  styleUrls: ['./vpcs-preferences.component.scss'],
  imports: [CommonModule, MatFormFieldModule, MatInputModule],
})
export class VpcsPreferencesComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  readonly cd = inject(ChangeDetectorRef);

  controller: Controller;
  vpcsExecutable = model('');

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');

    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();
    });
  }

  restoreDefaults() {
    this.vpcsExecutable.set('');
  }
}
