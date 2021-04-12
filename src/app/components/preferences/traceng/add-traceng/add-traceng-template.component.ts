import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { Server } from '../../../../models/server';
import { TracengTemplate } from '../../../../models/templates/traceng-template';
import { ServerService } from '../../../../services/server.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { TracengService } from '../../../../services/traceng.service';

@Component({
  selector: 'app-add-traceng-template',
  templateUrl: './add-traceng-template.component.html',
  styleUrls: ['./add-traceng-template.component.scss', '../../preferences.component.scss'],
})
export class AddTracengTemplateComponent implements OnInit {
  server: Server;
  templateName: string = '';
  ipAddress: string = '';
  templateNameForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private tracengService: TracengService,
    private router: Router,
    private toasterService: ToasterService,
    private templateMocksService: TemplateMocksService,
    private formBuilder: FormBuilder
  ) {
    this.templateNameForm = this.formBuilder.group({
      templateName: new FormControl(null, [Validators.required]),
      ipAddress: new FormControl(null, [Validators.required]),
    });
  }

  ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;
    });
  }

  goBack() {
    this.router.navigate(['/server', this.server.id, 'preferences', 'traceng', 'templates']);
  }

  addTemplate() {
    if (!this.templateNameForm.invalid) {
      this.templateName = this.templateNameForm.get('templateName').value;
      this.ipAddress = this.templateNameForm.get('ipAddress').value;
      let tracengTemplate: TracengTemplate = this.templateMocksService.getTracengTemplate();

      tracengTemplate.template_id = uuid();
      tracengTemplate.name = this.templateName;
      tracengTemplate.ip_address = this.ipAddress;

      this.tracengService.addTemplate(this.server, tracengTemplate).subscribe(() => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
}
