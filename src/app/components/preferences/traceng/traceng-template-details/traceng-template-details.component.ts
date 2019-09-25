import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { TracengService } from '../../../../services/traceng.service';
import { TracengTemplate } from '../../../../models/templates/traceng-template';


@Component({
    selector: 'app-traceng-template-details',
    templateUrl: './traceng-template-details.component.html',
    styleUrls: ['./traceng-template-details.component.scss', '../../preferences.component.scss']
})
export class TracengTemplateDetailsComponent implements OnInit {
    server: Server;
    tracengTemplate: TracengTemplate;
    inputForm: FormGroup;
    isSymbolSelectionOpened: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private tracengService: TracengService,
        private toasterService: ToasterService,
        private formBuilder: FormBuilder,
        private router: Router
    ) {
        this.inputForm = this.formBuilder.group({
            templateName: new FormControl('', Validators.required),
            defaultName: new FormControl('', Validators.required),
            symbol: new FormControl('', Validators.required)
        });
    }

    ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get("server_id");
        const template_id = this.route.snapshot.paramMap.get("template_id");
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.tracengService.getTemplate(this.server, template_id).subscribe((tracengTemplate: TracengTemplate) => {
                this.tracengTemplate = tracengTemplate;
            });
        });
    }

    goBack() {
        this.router.navigate(['/server', this.server.id, 'preferences', 'traceng', 'templates']);
    }

    onSave() {
        if (this.inputForm.invalid) {
            this.toasterService.error(`Fill all required fields`);
        } else {
            this.tracengService.saveTemplate(this.server, this.tracengTemplate).subscribe((tracengTemplate: TracengTemplate) => {
                this.toasterService.success("Changes saved");
            });
        }
    }

    chooseSymbol() {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    }

    symbolChanged(chosenSymbol: string) {
        this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
        this.tracengTemplate.symbol = chosenSymbol;
    }
}
