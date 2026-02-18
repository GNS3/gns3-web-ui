import {Component, Inject, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {Controller} from "@models/controller";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {PoolNameValidator} from "@components/resource-pools-management/add-resource-pool-dialog/PoolNameValidator";
import {ResourcePoolsService} from "@services/resource-pools.service";
import {ToasterService} from "@services/toaster.service";
import {poolNameAsyncValidator} from "@components/resource-pools-management/add-resource-pool-dialog/PoolNameAsyncValidator";

@Component({
  selector: 'app-add-resource-pool-dialog',
  templateUrl: './add-resource-pool-dialog.component.html',
  styleUrls: ['./add-resource-pool-dialog.component.scss'],
  providers: [PoolNameValidator]
})
export class AddResourcePoolDialogComponent implements OnInit {
  poolNameForm: UntypedFormGroup;
  controller: Controller;

  constructor(private dialogRef: MatDialogRef<AddResourcePoolDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { controller: Controller },
              private formBuilder: UntypedFormBuilder,
              private poolNameValidator: PoolNameValidator,
              private resourcePoolsService: ResourcePoolsService,
              private toasterService: ToasterService) {
  }

  ngOnInit(): void {
    this.controller = this.data.controller;
    this.poolNameForm = this.formBuilder.group({
      poolName: new UntypedFormControl(
          null,
          [Validators.required, this.poolNameValidator.get],
          [poolNameAsyncValidator(this.data.controller, this.resourcePoolsService)]
      ),
    });
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.onAddClick();
    }
  }

  get form() {
    return this.poolNameForm.controls;
  }

  onAddClick() {
    if (this.poolNameForm.invalid) {
      return;
    }
    const poolName = this.poolNameForm.controls['poolName'].value;

    this.resourcePoolsService.add(this.controller, poolName)
        .subscribe((pool) => {
          this.dialogRef.close(true);
        }, (error) => {
          this.toasterService.error(`An error occur while trying to create new pool ${poolName}`);
          this.dialogRef.close(false);
        });
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
