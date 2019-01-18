import { Component, OnInit } from "@angular/core";
import { Server } from '../../models/server';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../services/server.service';
import { switchMap } from 'rxjs/operators';


@Component({
    selector: 'app-preferences',
    templateUrl: './preferences.component.html',
    styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements OnInit {
    public serverId: string = "";

    constructor(
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.serverId = this.route.snapshot.paramMap.get("server_id");
    }
}
