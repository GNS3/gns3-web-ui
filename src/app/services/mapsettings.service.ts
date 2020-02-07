import { EventEmitter, Injectable } from "@angular/core";
import { Subject } from 'rxjs';

@Injectable()
export class MapSettingsService {
    public isMapLocked = new Subject<boolean>();
    public isTopologySummaryVisible = true;
    public isLogConsoleVisible = true;
    public isLayerNumberVisible = false;
    public interfaceLabels: Map<string, boolean> = new Map<string, boolean>();
    public mapRenderedEmitter = new EventEmitter<boolean>();

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

    toggleShowInterfaceLabels(projectId: string, value: boolean) {
        this.interfaceLabels.set(projectId, value);
    }
}
