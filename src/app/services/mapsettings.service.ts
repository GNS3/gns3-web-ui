import { EventEmitter, Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapSettingsService {
  public symbolScalingSubject: Subject<boolean> = new Subject<boolean>();

  public isScrollDisabled = new Subject<boolean>();
  public isMapLocked = new Subject<boolean>();
  public isTopologySummaryVisible: boolean = true;
  public isLogConsoleVisible: boolean = false;
  public isLayerNumberVisible: boolean = false;
  public logConsoleSubject = new Subject<boolean>();
  public mapRenderedEmitter = new EventEmitter<boolean>();

  public showInterfaceLabels: boolean = true;
  public integrateLinkLabelsToLinks: boolean = true;
  public openConsolesInWidget: boolean = false;

  constructor() {
    this.isLayerNumberVisible = localStorage.getItem('layersVisibility') === 'true' ? true : false;
    if (localStorage.getItem('integrateLinkLabelsToLinks'))
      this.integrateLinkLabelsToLinks = localStorage.getItem('integrateLinkLabelsToLinks') === 'true' ? true : false;
    if (localStorage.getItem('openConsolesInWidget'))
      this.openConsolesInWidget = localStorage.getItem('openConsolesInWidget') === 'true' ? true : false;
    let isSymbolScalingEnabled = true;
    if (localStorage.getItem('symbolScaling')) {
      isSymbolScalingEnabled = localStorage.getItem('symbolScaling') === 'true' ? true : false;
    } else {
      localStorage.setItem('symbolScaling', 'true');
    }
  }

  public getSymbolScaling(): boolean {
    return localStorage.getItem('symbolScaling') === 'true' ? true : false;
  }

  public setSymbolScaling(value: boolean) {
    if (value) {
      localStorage.setItem('symbolScaling', 'true');
    } else {
      localStorage.setItem('symbolScaling', 'false');
    }
    this.symbolScalingSubject.next(value);
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

  toggleOpenConsolesInWidget(value: boolean) {
    this.openConsolesInWidget = value;
    localStorage.removeItem('openConsolesInWidget');
    if (value) {
      localStorage.setItem('openConsolesInWidget', 'true');
    } else {
      localStorage.setItem('openConsolesInWidget', 'false');
    }
  }
}
