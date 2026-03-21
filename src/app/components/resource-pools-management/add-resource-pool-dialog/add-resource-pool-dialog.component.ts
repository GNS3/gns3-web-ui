import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {Controller} from "@models/controller";
import {MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from "@angular/material/dialog";
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {PoolNameValidator} from "@components/resource-pools-management/add-resource-pool-dialog/PoolNameValidator";
import {ResourcePoolsService} from "@services/resource-pools.service";
import {ToasterService} from "@services/toaster.service";
import {poolNameAsyncValidator} from "@components/resource-pools-management/add-resource-pool-dialog/PoolNameAsyncValidator";

@Component({
  standalone: true,
  selector: 'app-add-resource-pool-dialog',
  templateUrl: './add-resource-pool-dialog.component.html',
  styleUrls: ['./add-resource-pool-dialog.component.scss'],
  providers: [PoolNameValidator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class AddResourcePoolDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AddResourcePoolDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);
  private resourcePoolsService = inject(ResourcePoolsService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  poolNameForm: UntypedFormGroup;
  controller: Controller;

  constructor(
              @Inject(MAT_DIALOG_DATA) public data: { controller: Controller },
              private poolNameValidator: PoolNameValidator) {
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
    this.cd.markForCheck();
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
