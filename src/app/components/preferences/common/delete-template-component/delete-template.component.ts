import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Controller } from '@models/controller';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  standalone: true,
  selector: 'app-delete-template',
  templateUrl: './delete-template.component.html',
  styleUrls: ['./delete-template.component.scss'],
  imports: [MatDialogModule]
})
export class DeleteTemplateComponent {
  @Input() controller: Controller;
  @Output() deleteEvent = new EventEmitter<string>();

  private templateService = inject(TemplateService);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);

  deleteItem(templateName, templateId) {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '300px',
      height: '250px',
      data: {
        templateName: templateName,
      },
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((answer: boolean) => {
      if (answer) {
        this.templateService.deleteTemplate(this.controller, templateId).subscribe((answer) => {
          this.deleteEvent.emit(templateId);
          this.toasterService.success(`Template ${templateName} deleted.`);
        });
      }
    });
  }
}
