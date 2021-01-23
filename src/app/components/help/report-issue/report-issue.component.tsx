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
    ViewEncapsulation
  } from '@angular/core';
import { MyReactComponent } from '../report-issue/issue-list';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
  
const containerElementName = 'myReactComponentContainer';

@Component({
selector: 'app-report-issue',
templateUrl: './report-issue.component.html',
styleUrls: ['./report-issue.component.scss']
})
export class ReportIssueComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit  {
    @ViewChild('myReactComponentContainer') containerRef: ElementRef;

    constructor() {}

    ngOnInit() {
        //this.render();
    }

    ngOnChanges(changes: SimpleChanges): void {
        //this.render();
    }

    ngAfterViewInit() {
        this.render();
    }

    ngOnDestroy() {
        ReactDOM.unmountComponentAtNode(this.containerRef.nativeElement);
    }

    private render() {
        ReactDOM.render(<div className={'i-am-classy'}>
        <MyReactComponent />
        </div>, this.containerRef.nativeElement);
    }
}
