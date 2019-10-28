import { Injectable, EventEmitter } from "@angular/core";
import { Subject } from 'rxjs';
import { MapDimensions } from '../models/map-dimensions';
import { Project } from '../models/project';

@Injectable()
export class MapSettingsService {
    public isMapLocked = new Subject<boolean>();
    public isTopologySummaryVisible: boolean = false;
    public isLogConsoleVisible: boolean = false;
    public isLayerNumberVisible: boolean = false;
    public interfaceLabels: Map<string, boolean> = new Map<string, boolean>();
    public onMapResized = new EventEmitter<MapDimensions>();

    private mapWidth: number;
    private mapHeight: number;
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

    setMapDimensions(project: Project) {
        this.mapWidth = project.scene_width;
        this.mapHeight = project.scene_height;
    }
}
