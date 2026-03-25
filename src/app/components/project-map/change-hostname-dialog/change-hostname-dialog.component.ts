import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-change-hostname-dialog-component',
  templateUrl: './change-hostname-dialog.component.html',
  styleUrls: ['./change-hostname-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    ReactiveFormsModule,
  ],
})
export class ChangeHostnameDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ChangeHostnameDialogComponent>);
  public nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  inputForm: UntypedFormGroup;
  name: string;

  constructor() {
    // 初始化时直接使用传入的 node 的 name
    this.name = '';
    this.inputForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    // 直接使用传入的 node，不需要再次 API 获取
    // 因为传入的 node 已经包含最新信息
    if (this.node) {
      this.name = this.node.name;
      this.inputForm.get('name')?.setValue(this.node.name);
    }
    this.cd.markForCheck();
  }

  onSaveClick() {
    if (this.inputForm.valid) {
      // 从表单获取用户输入的新名称
      const newName = this.inputForm.get('name')?.value;
      this.node.name = newName;
      this.nodeService.updateNode(this.controller, this.node).subscribe({
        next: () => {
          this.toasterService.success(`Node ${this.node.name} updated.`);
          this.onCancelClick();
        },
        error: (error) => {
          const message = error.error?.message || 'Failed to update node.';
          this.toasterService.error(message);
        }
      });
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
