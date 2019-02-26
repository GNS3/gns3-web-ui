import { Component, Input } from "@angular/core";


@Component({
    selector: 'app-empty-templates-list',
    templateUrl: './empty-templates-list.component.html',
    styleUrls: ['./empty-templates-list.component.scss']
})
export class EmptyTemplatesListComponent {
    @Input() textMessage: string;
    emptyTemplatesListMessage: string = 'Empty templates list';

    constructor(){
        if (this.textMessage) {
            this.emptyTemplatesListMessage = this.textMessage;
        }
    }
}
