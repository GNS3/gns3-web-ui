import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsoleService } from '../../../services/settings/console.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss'],
})
export class ConsoleComponent implements OnInit {
  consoleForm = new UntypedFormGroup({
    command: new UntypedFormControl(''),
  });

  constructor(private router: Router, private consoleService: ConsoleService, private toasterService: ToasterService) {}

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
