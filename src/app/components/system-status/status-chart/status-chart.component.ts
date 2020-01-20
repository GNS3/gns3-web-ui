import { Component, OnInit, Input } from "@angular/core";
import { ComputeStatistics } from '../../../models/computeStatistics';


@Component({
    selector: 'app-status-chart',
    templateUrl: './status-chart.component.html',
    styleUrls: ['./status-chart.component.scss']
})
export class StatusChartComponent implements OnInit {
    @Input() computeStatistics: ComputeStatistics;

    constructor() {}

    ngOnInit() {}
}
