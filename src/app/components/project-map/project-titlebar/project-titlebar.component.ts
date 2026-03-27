import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  EventEmitter,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { TemplateComponent } from '@components/template/template.component';
import { NodesMenuComponent } from '../nodes-menu/nodes-menu.component';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { ImportApplianceComponent } from '../import-appliance/import-appliance.component';
import { AddBlankProjectDialogComponent } from '@components/projects/add-blank-project-dialog/add-blank-project-dialog.component';
import { ConfirmationBottomSheetComponent } from '@components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { EditProjectDialogComponent } from '@components/projects/edit-project-dialog/edit-project-dialog.component';
import { ImportProjectDialogComponent } from '@components/projects/import-project-dialog/import-project-dialog.component';
import { NavigationDialogComponent } from '@components/projects/navigation-dialog/navigation-dialog.component';
import { SaveProjectDialogComponent } from '@components/projects/save-project-dialog/save-project-dialog.component';
import { NewTemplateDialogComponent } from '../new-template-dialog/new-template-dialog.component';
import { ProjectService } from '@services/project.service';

@Component({
  selector: 'app-project-titlebar',
  standalone: true,
  templateUrl: './project-titlebar.component.html',
  styleUrls: ['./project-titlebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    TemplateComponent,
    NodesMenuComponent,
    ContextMenuComponent,
    ImportApplianceComponent,
  ],
})
export class ProjectTitlebarComponent {
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  readonly project = input<Project>(undefined);
  readonly controller = input<Controller>(undefined);
  readonly readonly = input(false);

  // 工具状态
  readonly toolsDrawLink = input(false);
  readonly toolsMoving = input(false);
  readonly isTopologySummaryVisible = input(true);

  // 视图状态
  readonly isInterfaceLabelVisible = input(false);
  readonly isConsoleVisible = input(true);
  readonly notificationsVisibility = input(false);
  readonly layersVisibility = input(false);
  readonly gridVisibility = input(false);
  readonly symbolScaling = input(true);

  // 事件输出
  readonly toggleDrawLine = output<void>();
  readonly toggleMovingMode = output<void>();
  readonly toggleTopologySummary = output<boolean>();
  readonly toggleShowInterfaceLabels = output<boolean>();
  readonly toggleShowConsole = output<boolean>();
  readonly toggleNotifications = output<boolean>();
  readonly toggleLayers = output<boolean>();
  readonly toggleGrid = output<boolean>();
  readonly toggleSnapToGrid = output<boolean>();
  readonly toggleSymbolScaling = output<boolean>();
  readonly onNodeCreation = output<any>();

  // 菜单引用
  readonly mainMenu = 'mainMenu';
  readonly projectMenu = 'projectMenu';
  readonly viewMenu = 'viewMenu';

  // 菜单操作方法
  addNewTemplate() {
    const dialogRef = this.dialog.open(NewTemplateDialogComponent, {
      width: '800px',
      maxHeight: '800px',
      autoFocus: false,
      disableClose: true,
      panelClass: 'new-template-dialog-panel',
    });
    dialogRef.componentInstance.controller = this.controller();
    dialogRef.componentInstance.project = this.project();
  }

  addNewProject() {
    const dialogRef = this.dialog.open(AddBlankProjectDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.componentInstance.controller = this.controller();
  }

  saveProject() {
    const dialogRef = this.dialog.open(SaveProjectDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.componentInstance.controller = this.controller();
    dialogRef.componentInstance.project = this.project();
  }

  editProject() {
    const dialogRef = this.dialog.open(EditProjectDialogComponent, {
      autoFocus: false,
      disableClose: true,
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel', 'edit-project-dialog-panel'],
    });
    dialogRef.componentInstance.controller = this.controller();
    dialogRef.componentInstance.project = this.project();
  }

  exportProject() {
    // 通过事件通知父组件处理
    console.log('Export project - to be implemented');
  }

  importProject() {
    let uuid: string = '';
    const dialogRef = this.dialog.open(ImportProjectDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.componentInstance.controller = this.controller();

    dialogRef.afterClosed().subscribe((isCancel: boolean) => {
      if (uuid && !isCancel) {
        const bottomSheetRef = this.bottomSheet.open(NavigationDialogComponent);
        // Note: projectMessage setting would need to be handled differently
      }
    });
  }

  closeProject() {
    const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
      data: { message: 'Do you want to close the project?' },
    });
    bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.projectService.close(this.controller(), this.project().project_id).subscribe(() => {
          this.router.navigate(['/controller', this.controller().id, 'projects']);
        });
      }
    });
  }

  deleteProject() {
    const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
      data: { message: 'Do you want to delete the project?' },
    });
    bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.projectService.delete(this.controller(), this.project().project_id).subscribe(() => {
          this.router.navigate(['/controller', this.controller().id, 'projects']);
        });
      }
    });
  }
}
