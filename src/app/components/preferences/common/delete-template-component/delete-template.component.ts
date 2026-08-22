import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, input } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Controller } from '@models/controller';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-delete-template',
  templateUrl: './delete-template.component.html',
  styleUrl: './delete-template.component.scss',
  imports: [MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteTemplateComponent {
  readonly controller = input<Controller>(undefined);
  @Output() deleteEvent = new EventEmitter<string>();

  private templateService = inject(TemplateService);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);

  deleteItem(templateName, templateId) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete template?',
        message: `Template "${templateName}" will be permanently deleted.`,
        note: 'This action cannot be undone.',
        confirmButtonText: 'Delete template',
        tone: 'danger',
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((answer: boolean) => {
      if (answer) {
        this.templateService.deleteTemplate(this.controller(), templateId).subscribe({
          next: () => {
            this.deleteEvent.emit(templateId);
            this.toasterService.success(`Template ${templateName} deleted.`);
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to delete template';
            this.toasterService.error(message);
          },
        });
      }
    });
  }
}
