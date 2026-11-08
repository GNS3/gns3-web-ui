/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 *
 * Author: Sylvain MATHIEU, Elise LEBEAU
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { PermissionService } from '@services/permission.service';

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
  imports: [CommonModule, RouterModule, MatTabsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  private permissionService = inject(PermissionService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  /** Each tab is the read gate of its child route; hide the dead ones. */
  private readonly tabPrivileges: Record<string, string> = {
    users: 'User.Audit',
    groups: 'Group.Audit',
    roles: 'Role.Audit',
    pools: 'Pool.Audit',
    ACL: 'ACE.Audit',
  };
  readonly links = computed(() =>
    [
      { label: 'Users', icon: 'people', route: 'users' },
      { label: 'Groups', icon: 'group', route: 'groups' },
      { label: 'Roles', icon: 'badge', route: 'roles' },
      { label: 'Pools', icon: 'folder_special', route: 'pools' },
      { label: 'ACL', icon: 'security', route: 'ACL' },
    ].filter((link) => this.permissionService.has(this.tabPrivileges[link.route])),
  );

  constructor() {}

  ngOnInit(): void {
    const controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }
}
