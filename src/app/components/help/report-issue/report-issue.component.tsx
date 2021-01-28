import { HttpClient } from '@angular/common/http';
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
    AfterContentInit
  } from '@angular/core';
import IssueListComponent from '../report-issue/issue-list';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import e from '../../../event-bus';
import { ToasterService } from '../../../services/toaster.service';

@Component({
selector: 'app-report-issue',
templateUrl: './report-issue.component.html',
styleUrls: ['./report-issue.component.scss']
})
export class ReportIssueComponent implements OnDestroy, AfterViewInit, AfterContentInit  {
    @ViewChild('issueListComponentContainer') containerRef: ElementRef;

    constructor(private toasterService: ToasterService) {}

    ngAfterViewInit() {
        this.render();
    }

    ngAfterContentInit() {
        e.on('message', message => {
            this.toasterService.success(message.text);
        });
    }

    ngOnDestroy() {
        ReactDOM.unmountComponentAtNode(this.containerRef.nativeElement);
    }

    private render() {
        ReactDOM.render(<div>
            <IssueListComponent />
        </div>, this.containerRef.nativeElement);
    }
} 
