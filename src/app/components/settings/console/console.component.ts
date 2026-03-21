import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConsoleService } from '@services/settings/console.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss'],
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
})
export class ConsoleComponent implements OnInit {
  consoleForm = new UntypedFormGroup({
    command: new UntypedFormControl(''),
  });

  private router = inject(Router);
  private consoleService = inject(ConsoleService);
  private toasterService = inject(ToasterService);

  ngOnInit() {
    const commandControl = this.consoleForm.get('command');
    commandControl.setValue(this.consoleService.command);
  }

  goBack() {
    this.router.navigate(['/settings']);
  }

  save() {
    const formValue = this.consoleForm.value;
    this.consoleService.command = formValue.command;
    this.toasterService.success('Console command has been updated.');
    this.goBack();
  }
}
