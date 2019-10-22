import { Injectable } from "@angular/core";
import { Subject } from 'rxjs';

@Injectable()
export class MapSettingsService {
    public isMapLocked = new Subject<boolean>();
    public isTopologySummaryVisible: boolean = true;
    public isLogConsoleVisible: boolean = true;
    public interfaceLabels: Map<string, boolean> = new Map<string, boolean>();

    constructor() {}

    changeMapLockValue(value: boolean) {
        this.isMapLocked.next(value);
    }

    toggleTopologySummary(value: boolean) {
        this.isTopologySummaryVisible = value;
    }

    toggleLogConsole(value: boolean) {
        this.isLogConsoleVisible = value;
    }

    toggleShowInterfaceLabels(projectId: string, value: boolean) {
        this.interfaceLabels.set(projectId, value);
    }
}
