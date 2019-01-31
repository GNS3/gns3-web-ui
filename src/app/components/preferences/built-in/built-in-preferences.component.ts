import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ServerService } from '../../../services/server.service';
import { switchMap } from 'rxjs/operators';


@Component({
    selector: 'app-built-in-preferences',
    templateUrl: './built-in-preferences.component.html',
    styleUrls: ['./built-in-preferences.component.scss']
})
export class BuiltInPreferencesComponent implements OnInit {
    public serverId: string = "";

    constructor(
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.serverId = this.route.snapshot.paramMap.get("server_id");
    }
}
