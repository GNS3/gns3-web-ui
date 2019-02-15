import { Component } from "@angular/core";


@Component({
    selector: 'app-empty-templates-list',
    templateUrl: './empty-templates-list.component.html',
    styleUrls: ['./empty-templates-list.component.scss']
})
export class EmptyTemplatesListComponent {
    emptyTemplatesListMessage: string = 'Empty templates list';
}
