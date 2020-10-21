import { Injectable, EventEmitter } from "@angular/core";
import { Subject } from 'rxjs';

@Injectable()
export class MapSettingsService {
    public isScrollDisabled = new Subject<boolean>();
    public isMapLocked = new Subject<boolean>();
    public isTopologySummaryVisible: boolean = true;
    public isLogConsoleVisible: boolean = false;
    public isLayerNumberVisible: boolean = false;
    public logConsoleSubject = new Subject<boolean>();
    public mapRenderedEmitter = new EventEmitter<boolean>();

    public showInterfaceLabels: boolean = true;
    public integrateLinkLabelsToLinks: boolean = true;
    public openReadme: boolean = true;

    constructor() {
        this.isLayerNumberVisible = localStorage.getItem('layersVisibility') === 'true' ? true : false;
        if (localStorage.getItem('integrateLinkLabelsToLinks')) this.integrateLinkLabelsToLinks = localStorage.getItem('integrateLinkLabelsToLinks') === 'true' ? true : false;
        if (localStorage.getItem('openReadme')) this.openReadme = localStorage.getItem('openReadme') === 'true' ? true : false;
    }

    changeMapLockValue(value: boolean) {
        this.isMapLocked.next(value);
    }

    setConsoleContextMenuAction(action: string) {
        localStorage.setItem('consoleContextMenu', action);
    }

    getConsoleContextManuAction(): string {
        return localStorage.getItem('consoleContextMenu');
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
        localStorage.removeItem('integrateLinkLabelsToLinks');
        if (value) {
            localStorage.setItem('integrateLinkLabelsToLinks', 'true');
        } else {
            localStorage.setItem('integrateLinkLabelsToLinks', 'false');
        }
    }

    toggleOpenReadme(value: boolean) {
        this.openReadme = value;
        localStorage.removeItem('openReadme');
        if (value) {
            localStorage.setItem('openReadme', 'true');
        } else {
            localStorage.setItem('openReadme', 'false');
        }
    }
}
