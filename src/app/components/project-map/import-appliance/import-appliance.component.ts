import { Component, Input, OnInit } from "@angular/core";
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { ComputeService } from '../../../services/compute.service';
import { ToasterService } from '../../../services/toaster.service';
import { ServerResponse } from '../../../models/serverResponse';
import { FileUploader, ParsedResponseHeaders, FileItem } from 'ng2-file-upload';


@Component({
    selector: 'app-import-appliance',
    templateUrl: './import-appliance.component.html',
    styleUrls: ['./import-appliance.component.scss']
})
export class ImportApplianceComponent implements OnInit {
    @Input('project') project: Project;
    @Input('server') server: Server;
    uploader: FileUploader;

    constructor(
        private computeService: ComputeService,
        private toasterService: ToasterService
    ) {}

    ngOnInit() {
        this.uploader = new FileUploader({});
        this.uploader.onAfterAddingFile = file => {
          file.withCredentials = false;
        };
    
        this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
          let serverResponse: ServerResponse = JSON.parse(response);
          let resultMessage = 'An error occured: ' + serverResponse.message;
          this.toasterService.error(resultMessage);
        };
    
        this.uploader.onCompleteItem = (
          item: FileItem,
          response: string,
          status: number,
          headers: ParsedResponseHeaders
        ) => {
          this.toasterService.success('Appliance imported successfully');
        };
    }

    public uploadAppliance(event) {
        const url = this.computeService.getUploadPath(this.server, event.target.files[0].name);
        this.uploader.queue.forEach(elem => (elem.url = url));
        const itemToUpload = this.uploader.queue[0];
        this.uploader.uploadItem(itemToUpload);
    }

    // public uploadAppliance(event) {
    //     let fileInput = event.target;
    //     let file: File = fileInput.files[0];
    //     let name: string = file.name;
    //     let fileReader: FileReader = new FileReader();
    
    //     fileReader.onloadend = () => {
    //         let appliance = fileReader.result;
    //         var obj = JSON.parse(appliance as string);
    //         console.log(obj);
    //         //   this.computeService.postAppliance(this.server, obj).subscribe(() => {
    //         //     this.toasterService.success('Appliance imported.');
    //         //   });
    //     }
    //     fileReader.readAsText(file);
    // }
}
