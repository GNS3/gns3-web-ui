import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportProjectDialogComponent, Validator } from "./import-project-dialog.component";
import { Server } from "../../../models/server";
import { MatInputModule, MatIconModule, MatSortModule, MatTableModule, MatTooltipModule, MatDialogModule, MatStepperModule, MatFormFieldModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from "@angular/material";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FileUploadModule, FileSelectDirective, FileItem, FileUploader } from "ng2-file-upload";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ImportProjectDialogComponent', () => {
    let component: ImportProjectDialogComponent;
    let fixture: ComponentFixture<ImportProjectDialogComponent>;
    let server: Server;
    let debugElement: DebugElement;
    let fileSelectDirective: FileSelectDirective;
    let formBuilder: FormBuilder;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                MatTableModule,
                MatTooltipModule,
                MatIconModule,
                MatSortModule,
                MatDialogModule,
                MatStepperModule,
                MatFormFieldModule,
                MatInputModule,
                NoopAnimationsModule,
                FileUploadModule,
                FormsModule,
                ReactiveFormsModule,
                RouterTestingModule.withRoutes([]),
            ],
            providers: [
                { provide: MatDialogRef },
                { provide: MAT_DIALOG_DATA }
            ],
            declarations : [ImportProjectDialogComponent]
        })
        .compileComponents();

        server = new Server();
        server.ip = "localhost";
        server.port = 80;
        formBuilder = new FormBuilder();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportProjectDialogComponent);
        debugElement = fixture.debugElement;
        component = fixture.componentInstance;
        component.server = server;
        component.projectNameForm = formBuilder.group({
            projectName: new FormControl(null, [Validators.required, Validator.projectNameValidator])
          });
        component.projectNameForm.controls['projectName'].setValue("ValidName");
        fixture.detectChanges();

        debugElement = fixture.debugElement.query(By.directive(FileSelectDirective));
        fileSelectDirective = debugElement.injector.get(FileSelectDirective) as FileSelectDirective;
    });

    it('should be created', () => {
        expect(fixture).toBeDefined();
        expect(component).toBeTruthy();
    });

    it('should set file uploader', () => {
        expect(fileSelectDirective).toBeDefined();
        expect(fileSelectDirective.uploader).toBe(component.uploader);
    });

    it('should handle file adding', () => {
        spyOn(fileSelectDirective.uploader, 'addToQueue');
    
        fileSelectDirective.onChange();
    
        const expectedArguments = [ debugElement.nativeElement.files,
          fileSelectDirective.getOptions(),
          fileSelectDirective.getFilters() ];
        expect(fileSelectDirective.uploader.addToQueue).toHaveBeenCalledWith(...expectedArguments);
    });

    it('should call uploading item', () => {
        spyOn(fileSelectDirective.uploader, 'uploadItem');

        component.onImportClick();

        expect(fileSelectDirective.uploader.uploadItem).toHaveBeenCalled();
    });

    it('should call uploading item with correct arguments', () => {
        let fileItem = new FileItem(fileSelectDirective.uploader,new File([],"fileName"),{});
        fileSelectDirective.uploader.queue.push(fileItem);
        spyOn(fileSelectDirective.uploader, 'uploadItem');

        component.onImportClick();

        expect(fileSelectDirective.uploader.uploadItem).toHaveBeenCalledWith(fileItem);
    });

    it('should handle file change event', () => {
        let input  = fixture.debugElement.query(By.css('input[type=file]')).nativeElement;
        spyOn(component, 'uploadProjectFile');

        input.dispatchEvent(new Event('change'));

        expect(component.uploadProjectFile).toHaveBeenCalled();
    });

    it('should clear queue after calling delete', () => {
        fileSelectDirective.uploader.queue.push(new FileItem(fileSelectDirective.uploader,new File([],"fileName"),{}));
        spyOn(fileSelectDirective.uploader.queue, "pop");
        
        component.onDeleteClick();

        expect(fileSelectDirective.uploader.queue.pop).toHaveBeenCalled();
        expect(fileSelectDirective.uploader.queue[0]).toBeNull;
    });

    it('should prepare correct upload path for file', () => {
        fileSelectDirective.uploader.queue.push(new FileItem(fileSelectDirective.uploader,new File([],"fileName"),{}));
        component.projectNameForm.controls['projectName'].setValue("newProject");

        component.onImportClick();

        expect(fileSelectDirective.uploader.queue[0].url).toContain("localhost:80");
        expect(fileSelectDirective.uploader.queue[0].url).toContain("newProject");
    });

    it('should navigate to next step after clicking import', () => {
        let fileItem = new FileItem(fileSelectDirective.uploader, new File([],"fileName"),{});
        fileSelectDirective.uploader.queue.push(fileItem);
        spyOn(component.stepper, "next");

        component.onImportClick();

        expect(component.stepper.next).toHaveBeenCalled();
    });

    it('should detect if file input is empty', () => {
        component.projectNameForm.controls['projectName'].setValue("");
        fixture.detectChanges();
        spyOn(component.stepper, "next");
        spyOn(fileSelectDirective.uploader, 'uploadItem');

        component.onImportClick();

        expect(component.stepper.next).not.toHaveBeenCalled();
        expect(fileSelectDirective.uploader.uploadItem).not.toHaveBeenCalled();
        expect(component.projectNameForm.valid).toBeFalsy();
    });

    it('should sanitize file name input', () => {
        component.projectNameForm.controls['projectName'].setValue("[][]");
        fixture.detectChanges();
        spyOn(component.stepper, "next");
        spyOn(fileSelectDirective.uploader, 'uploadItem');

        component.onImportClick();

        expect(component.stepper.next).not.toHaveBeenCalled();
        expect(fileSelectDirective.uploader.uploadItem).not.toHaveBeenCalled();
        expect(component.projectNameForm.valid).toBeFalsy();
    });
});
