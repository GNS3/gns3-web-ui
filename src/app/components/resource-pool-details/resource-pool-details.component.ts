import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, UntypedFormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { ToasterService } from '@services/toaster.service';
import { ActivatedRoute } from '@angular/router';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { map, startWith } from 'rxjs/operators';
import { Project } from '@models/project';
import { Observable } from 'rxjs';
import { Resource } from '@models/resourcePools/Resource';
import { DeleteResourceConfirmationDialogComponent } from '@components/resource-pool-details/delete-resource-confirmation-dialog/delete-resource-confirmation-dialog.component';

@Component({
  selector: 'app-resource-pool-details',
  templateUrl: './resource-pool-details.component.html',
  styleUrl: './resource-pool-details.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcePoolDetailsComponent implements OnInit {
  private toastService = inject(ToasterService);
  private route = inject(ActivatedRoute);
  private resourcePoolsService = inject(ResourcePoolsService);
  private dialog = inject(MatDialog);

  controller: Controller;
  pool = signal<ResourcePool | undefined>(undefined);
  addResourceFormControl = new FormControl('');
  addResourceFilteredOptions: Observable<string[]>;
  projects = signal<Project[]>([]);

  editPoolForm: FormGroup = new FormGroup({
    poolname: new FormControl(''),
  });

  ngOnInit(): void {
    this.route.data.subscribe((d: { controller: Controller; pool: ResourcePool }) => {
      this.controller = d.controller;
      this.pool.set(d.pool);
      this.editPoolForm.patchValue({ poolname: d.pool.name });
      this.refresh();
    });
  }

  onUpdate(): void {
    const name = this.editPoolForm.get('poolname')?.value;
    if (name && this.pool()) {
      this.pool.update((p) => (p ? { ...p, name } : p));
      this.resourcePoolsService.update(this.controller, this.pool()).subscribe((pool: ResourcePool) => {
        this.toastService.success(`Pool ${pool.name} updated`);
      });
    }
  }

  addResource(): void {
    const selected = this.addResourceFormControl.value;
    const project = this.projects().filter((p) => p.name.includes(selected));
    if (project.length === 1) {
      this.resourcePoolsService.addResource(this.controller, this.pool(), project[0]).subscribe(() => {
        this.toastService.success(`Project ${project[0].name} added to pool: ${this.pool().name}`);
        this.refresh();
        this.addResourceFormControl.setValue('');
      });
      return;
    }
    if (project.length === 0) {
      this.toastService.error(`Cannot find related project with string: ${selected}`);
      return;
    }
    if (project.length > 1) {
      this.toastService.error(`${project.length} matches for ${selected}, please be more accurate`);
    }
  }

  deleteResource(resource: Resource): void {
    this.dialog
      .open(DeleteResourceConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        data: resource,
      })
      .afterClosed()
      .subscribe((result: Resource) => {
        if (result) {
          this.resourcePoolsService.deleteResource(this.controller, result, this.pool()).subscribe(() => {
            this.refresh();
            this.toastService.success(`Resource ${result.name} deleted from pool ${this.pool().name}`);
          });
        }
      });
  }

  private refresh(): void {
    this.resourcePoolsService.get(this.controller, this.pool().resource_pool_id).subscribe((pool) => {
      this.pool.set(pool);
    });

    this.resourcePoolsService.getFreeResources(this.controller).subscribe((projects: Project[]) => {
      this.projects.set(projects);
      this.addResourceFilteredOptions = this.addResourceFormControl.valueChanges.pipe(
        startWith(''),
        map((value: string) =>
          this.projects()
            .filter((project: Project) => project.name.toLowerCase().includes(value?.toLowerCase() || ''))
            .map((project: Project) => project.name)
        )
      );
    });
  }
}
