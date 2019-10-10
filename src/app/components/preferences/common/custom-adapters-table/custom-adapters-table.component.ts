import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CustomAdapter } from '../../../../models/qemu/qemu-custom-adapter';


@Component({
    selector: 'app-custom-adapters-table',
    templateUrl: './custom-adapters-table.component.html',
    styleUrls: ['../../preferences.component.scss']
})
export class CustomAdaptersTableComponent {
    @Input() networkTypes = [];
    @Input() displayedColumns: string[] = []; 
    @Input() adapters: CustomAdapter[] = [];

    public numberOfAdapters: number;

    onAdd() {
        let adapter: CustomAdapter = {
            adapter_number: this.adapters.length,
            adapter_type: this.networkTypes[0]
        }
        this.adapters = this.adapters.concat([adapter]);
    }

    delete(adapter: CustomAdapter) {
        this.adapters = this.adapters.filter(elem => elem!== adapter);
    }
}
