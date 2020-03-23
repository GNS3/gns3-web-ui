import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { ResizeEvent } from 'angular-resizable-element';
import { ThemeService } from '../../../services/theme.service';
import { FormControl } from '@angular/forms';
import { NodeConsoleService } from '../../../services/nodeConsole.service';


@Component({
    selector: 'app-console-wrapper',
    templateUrl: './console-wrapper.component.html',
    styleUrls: ['./console-wrapper.component.scss']
})
export class ConsoleWrapperComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() server: Server;
    @Input() project: Project;
    @Output() closeConsole =  new EventEmitter<boolean>();

    filters: string[] = ['all', 'errors', 'warnings', 'info', 'map updates', 'server requests'];
    selectedFilter: string = 'all';

    public style: object = {};
    public styleInside: object = { height: `120px` };

    public isDraggingEnabled: boolean = false;
    public isLightThemeEnabled: boolean = false;

    constructor(
        private consoleService: NodeConsoleService,
        private themeService: ThemeService
    ) {}

    nodes: Node[] = [];
    selected = new FormControl(0);
    
    ngOnInit() {
        this.themeService.getActualTheme() === 'light' ? this.isLightThemeEnabled = true : this.isLightThemeEnabled = false; 
        this.style = { bottom: '20px', left: '20px', width: '600px', height: '180px'}; // style properties

        this.consoleService.nodeConsoleTrigger.subscribe((node) => {
            this.addTab(node, true);
        });
    }

    ngAfterViewInit() {
        // this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }

    ngOnDestroy() {}

    addTab(node: Node, selectAfterAdding: boolean) {
        this.nodes.push(node);

        if (selectAfterAdding) {
            this.selected.setValue(this.nodes.length);
        }
    }

    removeTab(index: number) {
        this.nodes.splice(index, 1);
    }

    toggleDragging(value: boolean) {
        this.isDraggingEnabled = value;
    }

    dragWidget(event) {
        let x: number = Number(event.movementX);
        let y: number = Number(event.movementY);

        let width: number = Number(this.style['width'].split('px')[0]);
        let height: number = Number(this.style['height'].split('px')[0]);
        let left: number = Number(this.style['left'].split('px')[0]) + x;
        if (this.style['top']) {
            let top: number = Number(this.style['top'].split('px')[0]) + y;
            this.style = {
                position: 'fixed',
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`
            };
        } else {
            let bottom: number = Number(this.style['bottom'].split('px')[0]) - y;
            this.style = {
                position: 'fixed',
                left: `${left}px`,
                bottom: `${bottom}px`,
                width: `${width}px`,
                height: `${height}px`
            };
        }
    }

    validate(event: ResizeEvent): boolean {
        if (
            event.rectangle.width &&
            event.rectangle.height &&
            (event.rectangle.width < 600 ||
            event.rectangle.height < 180)
        ) {
            return false;
        }
        return true;
    }

    onResizeEnd(event: ResizeEvent): void {
        this.style = {
            position: 'fixed',
            left: `${event.rectangle.left}px`,
            top: `${event.rectangle.top}px`,
            width: `${event.rectangle.width}px`,
            height: `${event.rectangle.height}px`
        };

        this.styleInside = {
            height: `${event.rectangle.height - 60}px`,
            width: `${event.rectangle.width}px`
        };
    }

    close() {
        this.closeConsole.emit(false);
    }
}
