import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';


@Component({
    selector: 'app-custom-adapters',
    templateUrl: './custom-adapters.component.html',
    styleUrls: ['./custom-adapters.component.scss', '../../preferences.component.scss']
})
export class CustomAdaptersComponent {
    @Input() networkTypes = [];
    @Input() displayedColumns: string[] = []; 
    @Output() closeConfiguratorEmitter = new EventEmitter<boolean>();
    @Output() saveConfigurationEmitter =  new EventEmitter<CustomAdapter[]>();

    public adapters: CustomAdapter[];
    public numberOfAdapters: number;

    cancelConfigureCustomAdapters(){
        this.closeConfiguratorEmitter.emit(false);
    }

    configureCustomAdapters(){
        this.saveConfigurationEmitter.emit(this.adapters);
    }
}
