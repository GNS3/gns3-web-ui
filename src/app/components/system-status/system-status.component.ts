import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';


@Component({
    selector: 'app-system-status',
    templateUrl: './system-status.component.html',
    styleUrls: ['./system-status.component.scss']
})
export class SystemStatusComponent implements OnInit {
    public serverId = "";

    constructor(
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.serverId = this.route.snapshot.paramMap.get("server_id");
    }
}
