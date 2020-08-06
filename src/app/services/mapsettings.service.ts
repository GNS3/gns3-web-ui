import { Injectable, EventEmitter } from "@angular/core";
import { Subject } from 'rxjs';

@Injectable()
export class MapSettingsService {
    public isMapLocked = new Subject<boolean>();
    public isTopologySummaryVisible: boolean = true;
    public isLogConsoleVisible: boolean = false;
    public isLayerNumberVisible: boolean = false;
    public logConsoleSubject = new Subject<boolean>();
    public mapRenderedEmitter = new EventEmitter<boolean>();

    public showInterfaceLabels: boolean = true;
    public integrateLinkLabelsToLinks: boolean = false;

    constructor() {
        this.isLayerNumberVisible = localStorage.getItem('layersVisibility') === 'true' ? true : false;
    }

    changeMapLockValue(value: boolean) {
        this.isMapLocked.next(value);
    }

    toggleTopologySummary(value: boolean) {
        this.isTopologySummaryVisible = value;
    }

    toggleLogConsole(value: boolean) {
        this.isLogConsoleVisible = value;
    }

    toggleLayers(value: boolean) {
        this.isLayerNumberVisible = value;
    }

    toggleShowInterfaceLabels(value: boolean) {
        this.showInterfaceLabels = value;
    }

    toggleIntegrateInterfaceLabels(value: boolean) {
        this.integrateLinkLabelsToLinks = value;
    }
}
