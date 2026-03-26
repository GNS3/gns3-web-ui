import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcePoolDetailsComponent implements OnInit {
  private toastService = inject(ToasterService);
  private route = inject(ActivatedRoute);
  private resourcePoolsService = inject(ResourcePoolsService);
  private dialog = inject(MatDialog);

  controller: Controller;
  editPoolForm: UntypedFormGroup;
  pool = signal<ResourcePool | undefined>(undefined);
  addResourceFormControl = new FormControl('');
  addResourceFilteredOptions: Observable<string[]>;
  projects = signal<Project[]>([]);

  constructor() {
    this.editPoolForm = new UntypedFormGroup({
      poolname: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe((d: { controller: Controller; pool: ResourcePool }) => {
      this.controller = d.controller;
      this.pool.set(d.pool);

      this.refresh();
    });
  }

  onUpdate() {
    this.resourcePoolsService.update(this.controller, this.pool()).subscribe((pool: ResourcePool) => {
      this.toastService.success(`pool ${pool.name}, updated`);
    });
  }
  addResource() {
    const selected = this.addResourceFormControl.value;
    const project = this.projects().filter((p) => p.name.includes(selected));
    if (project.length === 1) {
      this.resourcePoolsService.addResource(this.controller, this.pool(), project[0]).subscribe(() => {
        this.toastService.success(`project : ${project[0].name}, added to pool: ${this.pool().name}`);
        this.refresh();
        this.addResourceFormControl.setValue('');
        return;
      });
      return;
    }
    if (project.length === 0) {
      this.toastService.error(`cannot found related project with string: ${selected}`);
      return;
    }
    if (project.length > 1) {
      this.toastService.error(`${project.length} match ${selected}, please be more accurate`);
      return;
    }
  }

  deleteResource(resource: Resource) {
    this.dialog
      .open(DeleteResourceConfirmationDialogComponent, { data: resource })
      .afterClosed()
      .subscribe((resource: Resource) => {
        if (resource) {
          this.resourcePoolsService.deleteResource(this.controller, resource, this.pool()).subscribe(() => {
            this.refresh();
            this.toastService.success(`resource ${resource.name} delete from pool ${this.pool().name}`);
          });
        }
      });
  }

  private refresh() {
    this.resourcePoolsService.get(this.controller, this.pool().resource_pool_id).subscribe((pool) => {
      this.pool.set(pool);
    });

    this.resourcePoolsService.getFreeResources(this.controller).subscribe((projects: Project[]) => {
      this.projects.set(projects);

      this.addResourceFilteredOptions = this.addResourceFormControl.valueChanges.pipe(
        startWith(''),
        map((value: string) => {
          return this.projects()
            .filter((project: Project) => project.name.toLowerCase().includes(value.toLowerCase() || ''))
            .map((project: Project) => project.name);
        })
      );
    });
  }
}
