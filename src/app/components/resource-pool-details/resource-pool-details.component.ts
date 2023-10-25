import {Component, OnInit} from '@angular/core';
import {Controller} from "@models/controller";
import {FormControl, UntypedFormControl, UntypedFormGroup} from "@angular/forms";
import {ToasterService} from "@services/toaster.service";
import {ActivatedRoute} from "@angular/router";
import {ResourcePool} from "@models/resourcePools/ResourcePool";
import {ResourcePoolsService} from "@services/resource-pools.service";
import {map, startWith} from "rxjs/operators";
import {Project} from "@models/project";
import {Observable} from "rxjs";
import {Resource} from "@models/resourcePools/Resource";
import {MatDialog} from "@angular/material/dialog";
import {
  DeleteResourceConfirmationDialogComponent
} from "@components/resource-pool-details/delete-resource-confirmation-dialog/delete-resource-confirmation-dialog.component";

@Component({
  selector: 'app-resource-pool-details',
  templateUrl: './resource-pool-details.component.html',
  styleUrls: ['./resource-pool-details.component.scss']
})
export class ResourcePoolDetailsComponent implements OnInit {

  controller: Controller;
  editPoolForm: UntypedFormGroup;
  pool: ResourcePool;
  addResourceFormControl = new FormControl('');
  addResourceFilteredOptions: Observable<string[]>;
  projects: Project[] = [];

  constructor(private toastService: ToasterService,
              private route: ActivatedRoute,
              private resourcePoolsService: ResourcePoolsService,
              private dialog: MatDialog,
  ) {


    this.editPoolForm = new UntypedFormGroup({
      poolname: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe((d: { controller: Controller; pool: ResourcePool }) => {
      this.controller = d.controller;
      this.pool = d.pool;

    this.refresh();

    });


  }

  onUpdate() {
    this.resourcePoolsService.update(this.controller, this.pool)
      .subscribe((pool: ResourcePool) => {
        this.toastService.success(`pool ${pool.name}, updated`);
      });
  }
  addResource() {
      const selected = this.addResourceFormControl.value;
      const project = this.projects.filter( p => p.name.includes(selected));
      if(project.length === 1) {
        this.resourcePoolsService.addResource(this.controller,this.pool, project[0])
          .subscribe(() => {
            this.toastService.success(`project : ${project[0].name}, added to pool: ${this.pool.name}`);
            this.refresh();
            this.addResourceFormControl.setValue('');
            return;
          });
        return;
      }
      if(project.length === 0) {
        this.toastService.error(`cannot found related project with string: ${selected}`);
        return;
      }
      if(project.length > 1) {
        this.toastService.error(`${project.length} match ${selected}, please be more accurate`);
        return;
      }
  }

  deleteResource(resource: Resource) {
    this.dialog.open(DeleteResourceConfirmationDialogComponent, {data: resource})
      .afterClosed()
      .subscribe((resource: Resource) => {
        if(resource) {
          this.resourcePoolsService
            .deleteResource(this.controller, resource, this.pool)
            .subscribe(() => {
              this.refresh()
              this.toastService.success(`resource ${resource.name} delete from pool ${this.pool.name}`)
            });
        }
      })
  }

  private refresh() {
    this.resourcePoolsService
      .get(this.controller, this.pool.resource_pool_id)
      .subscribe((pool) => {
        this.pool = pool;
      });

    this.resourcePoolsService
      .getFreeResources(this.controller)
      .subscribe((projects: Project[]) => {
        this.projects = projects;

        this.addResourceFilteredOptions = this.addResourceFormControl.valueChanges.pipe(
          startWith(''),
          map((value: string) => {
            return this.projects
              .filter((project: Project) => project.name.toLowerCase().includes(value.toLowerCase() || ''))
              .map((project: Project) => project.name);
          })
        );
      });
  }
}
