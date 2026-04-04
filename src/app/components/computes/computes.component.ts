import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Controller } from '@models/controller';
import { Compute, ComputeCreate, ComputeUpdate } from '@models/compute';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteConfirmationDialogComponent } from '@components/preferences/common/delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-computes',
  templateUrl: './computes.component.html',
  styleUrl: './computes.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
})
export class ComputesComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private computeService = inject(ComputeService);
  private notificationService = inject(NotificationService);
  private toasterService = inject(ToasterService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  computes = signal<Compute[]>([]);
  displayedColumns = ['status', 'name', 'host', 'connected', 'cpu', 'memory', 'disk', 'actions'];
  loading = signal(true);
  private subscription = new Subscription();

  ngOnInit() {
    this.loadControllerAndComputes();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadControllerAndComputes() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;
      this.cd.markForCheck();
      this.loadComputes();
      this.connectToGlobalNotifications();
    });
  }

  connectToGlobalNotifications() {
    // Connect to global WebSocket
    this.notificationService.connectToComputeNotifications(this.controller);

    // Subscribe to compute notifications
    this.subscription.add(
      this.notificationService.computeNotificationEmitter.subscribe((notification) => {
        this.handleComputeNotification(notification);
      })
    );
  }

  handleComputeNotification(notification: { action: string; event: Compute }) {
    switch (notification.action) {
      case 'compute.created':
        this.computes.update((computes) => [...computes, notification.event]);
        this.toasterService.success(`Compute "${notification.event.name}" added`);
        break;
      case 'compute.updated':
        this.computes.update((computes) =>
          computes.map((c) => (c.compute_id === notification.event.compute_id ? notification.event : c))
        );
        break;
      case 'compute.deleted':
        this.computes.update((computes) => computes.filter((c) => c.compute_id !== notification.event.compute_id));
        this.toasterService.success(`Compute "${notification.event.name}" deleted`);
        break;
    }
    this.cd.markForCheck();
  }

  loadComputes() {
    this.loading.set(true);
    this.computeService.getComputes(this.controller).subscribe({
      next: (computes) => {
        this.computes.set(computes);
        this.loading.set(false);
        this.cd.markForCheck();
      },
      error: (error) => {
        this.loading.set(false);
        this.toasterService.error('Failed to load computes: ' + error);
        this.cd.markForCheck();
      },
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddComputeDialogComponent, {
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      autoFocus: false,
      disableClose: true,
      data: { controller: this.controller },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.computeService.createCompute(this.controller, result).subscribe({
          next: () => {
            this.toasterService.success('Compute added successfully');
            this.loadComputes();
          },
          error: (error) => {
            this.toasterService.error('Failed to add compute: ' + error);
            this.cd.markForCheck();
          },
        });
      }
    });
  }

  openEditDialog(compute: Compute) {
    // First fetch full compute details from server
    this.computeService.getCompute(this.controller, compute.compute_id).subscribe({
      next: (fullCompute) => {
        const dialogRef = this.dialog.open(AddComputeDialogComponent, {
          panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
          autoFocus: false,
          disableClose: true,
          data: { controller: this.controller, compute: fullCompute },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.computeService.updateCompute(this.controller, compute.compute_id, result).subscribe({
              next: () => {
                this.toasterService.success('Compute updated successfully');
                this.loadComputes();
              },
              error: (error) => {
                this.toasterService.error('Failed to update compute: ' + error);
                this.cd.markForCheck();
              },
            });
          }
        });
      },
      error: (error) => {
        this.toasterService.error('Failed to load compute details: ' + error);
        this.cd.markForCheck();
      },
    });
  }

  deleteCompute(compute: Compute) {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
      autoFocus: false,
      disableClose: true,
      data: {
        templateName: compute.name || compute.compute_id,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.computeService.deleteCompute(this.controller, compute.compute_id).subscribe({
          next: () => {
            this.toasterService.success('Compute deleted successfully');
            this.loadComputes();
          },
          error: (error) => {
            this.toasterService.error('Failed to delete compute: ' + error);
            this.cd.markForCheck();
          },
        });
      }
    });
  }

  connectCompute(compute: Compute) {
    this.computeService.connectCompute(this.controller, compute.compute_id).subscribe({
      next: () => {
        this.toasterService.success('Connection request sent');
        // Refresh the specific compute to get updated status
        this.computeService.getCompute(this.controller, compute.compute_id).subscribe({
          next: (updatedCompute) => {
            const computes = this.computes().map((c) =>
              c.compute_id === updatedCompute.compute_id ? updatedCompute : c
            );
            this.computes.set(computes);
            this.cd.markForCheck();
          },
          error: () => {
            // Fallback to full reload
            this.loadComputes();
          },
        });
      },
      error: (error) => {
        this.toasterService.error('Failed to connect compute: ' + error);
        this.cd.markForCheck();
      },
    });
  }

  getStatusIcon(compute: Compute): string {
    return compute.connected ? 'check_circle' : 'cancel';
  }

  getStatusColor(compute: Compute): string {
    return compute.connected ? 'var(--mat-sys-primary)' : 'var(--mat-sys-error)';
  }

  formatPercent(value: number | undefined): string {
    return value !== undefined ? `${value.toFixed(1)}%` : '--';
  }

  formatHost(compute: Compute): string {
    return `${compute.host}:${compute.port}`;
  }
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-compute-dialog',
  templateUrl: './add-compute-dialog.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
})
export class AddComputeDialogComponent {
  private dialogRef = inject(MatDialogRef<AddComputeDialogComponent>);
  readonly data = inject<{ controller: Controller; compute?: Compute }>(MAT_DIALOG_DATA);

  protocols = [
    { key: 'http', name: 'HTTP' },
    { key: 'https', name: 'HTTPS' },
  ];

  computeForm = new UntypedFormGroup({
    name: new UntypedFormControl(''),
    protocol: new UntypedFormControl('http', [Validators.required]),
    host: new UntypedFormControl('', [Validators.required]),
    port: new UntypedFormControl(3080, [Validators.required, Validators.min(1), Validators.max(65535)]),
    user: new UntypedFormControl('gns3'),
    password: new UntypedFormControl('gns3'),
  });

  isEditMode = false;

  constructor() {
    if (this.data.compute) {
      this.isEditMode = true;
      this.computeForm.patchValue({
        name: this.data.compute.name,
        protocol: this.data.compute.protocol,
        host: this.data.compute.host,
        port: this.data.compute.port,
        user: this.data.compute.user,
        password: '',
      });
    }
  }

  onSaveClick(): void {
    if (!this.computeForm.valid) {
      return;
    }

    const formValue = this.computeForm.value;
    const computeData: ComputeCreate | ComputeUpdate = {
      protocol: formValue.protocol as 'http' | 'https',
      host: formValue.host!,
      port: formValue.port!,
      user: formValue.user || undefined,
      name: formValue.name || undefined,
    };

    // Only include password if user entered a password (empty/null causes 500 error)
    if (formValue.password && formValue.password.trim() !== '') {
      computeData.password = formValue.password;
    }

    this.dialogRef.close(computeData);
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}
