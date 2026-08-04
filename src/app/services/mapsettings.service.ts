import { EventEmitter, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ThemeService } from './theme.service';

export interface WorkspaceTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
}

export interface WorkspaceLinkStyle {
  color: string;
  width: number;
  type: number;
  link_type: string;
}

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
  public isItemLockStatusVisible: boolean = false;
  public logConsoleSubject = new Subject<boolean>();
  public mapRenderedEmitter = new EventEmitter<boolean>();
  public openReadme: boolean;
  public showInterfaceLabels: boolean = true;
  public integrateLinkLabelsToLinks: boolean = true;
  public openConsolesInWidget: boolean = false;

  // Project-workspace defaults — values used when creating a new project.
  // Persisted locally (the GNS3 web-friendly controller has no /settings
  // endpoint with Graphicsview; the existing workspace prefs — openReadme,
  // integrateLinkLabelsToLinks, openConsolesInWidget — follow the same
  // localStorage-backed pattern). Defaults mirror the GNS3 server project
  // defaults (Project model / fixtures): scene_width 2000, scene_height 1000,
  // grid_size 75, drawing_grid_size 25, show_grid false, snap_to_grid false.
  public defaultSceneWidth: number;
  public defaultSceneHeight: number;
  public defaultGridSize: number;
  public defaultDrawingGridSize: number;
  public defaultShowGrid: boolean;
  public defaultSnapToGrid: boolean;
  private defaultLabelStyle: WorkspaceTextStyle;
  private defaultNoteStyle: WorkspaceTextStyle;
  private defaultLinkStyle: WorkspaceLinkStyle;

  public static readonly FONT_FAMILIES = [
    'TypeWriter',
    'Noto Sans',
    'Arial',
    'Courier New',
    'Times New Roman',
    'Helvetica',
    'Verdana',
    'Georgia',
    'Comic Sans MS',
  ];
  public static readonly FONT_WEIGHTS = ['normal', 'bold'];
  public static readonly LINK_STYLE_NAMES = ['Invisible', 'Solid', 'Dash', 'Dot', 'Dash Dot', 'Dash Dot Dot'];
  public static readonly LINK_TYPES = [
    { label: 'Straight', value: 'straight' },
    { label: 'Bezier', value: 'bezier' },
    { label: 'Flowchart', value: 'flowchart' },
    { label: 'StateMachine', value: 'statemachine' },
    { label: 'Freeform', value: 'freeform' },
  ];

  private static readonly DEFAULT_SCENE_WIDTH = 2000;
  private static readonly DEFAULT_SCENE_HEIGHT = 1000;
  private static readonly DEFAULT_GRID_SIZE = 75;
  private static readonly DEFAULT_DRAWING_GRID_SIZE = 25;
  private static readonly DEFAULT_SHOW_GRID = false;
  private static readonly DEFAULT_SNAP_TO_GRID = false;
  private readonly defaultLabelStyleFallback: WorkspaceTextStyle;
  private readonly defaultNoteStyleFallback: WorkspaceTextStyle;
  private readonly defaultLinkStyleFallback: WorkspaceLinkStyle;

  private static readonly SCENE_WIDTH_KEY = 'defaultSceneWidth';
  private static readonly SCENE_HEIGHT_KEY = 'defaultSceneHeight';
  private static readonly GRID_SIZE_KEY = 'defaultGridSize';
  private static readonly DRAWING_GRID_SIZE_KEY = 'defaultDrawingGridSize';
  private static readonly SHOW_GRID_KEY = 'defaultShowGrid';
  private static readonly SNAP_TO_GRID_KEY = 'defaultSnapToGrid';
  private static readonly LABEL_STYLE_KEY = 'defaultLabelStyle';
  private static readonly NOTE_STYLE_KEY = 'defaultNoteStyle';
  private static readonly LINK_STYLE_KEY = 'defaultLinkStyle';

  constructor(private themeService: ThemeService) {
    this.defaultLabelStyleFallback = {
      fontFamily: 'TypeWriter',
      fontSize: 10,
      fontWeight: 'bold',
      color: this.themeService.getCanvasLabelColor(),
    };
    this.defaultNoteStyleFallback = {
      fontFamily: 'Noto Sans',
      fontSize: 11,
      fontWeight: 'bold',
      color: this.themeService.getCanvasLabelColor(),
    };
    this.defaultLinkStyleFallback = {
      color: this.themeService.getCanvasLinkColor(),
      width: 2,
      type: 1,
      link_type: 'straight',
    };

    this.isLayerNumberVisible = localStorage.getItem('layersVisibility') === 'true' ? true : false;
    if (localStorage.getItem('integrateLinkLabelsToLinks'))
      this.integrateLinkLabelsToLinks = localStorage.getItem('integrateLinkLabelsToLinks') === 'true' ? true : false;
    if (localStorage.getItem('openConsolesInWidget'))
      this.openConsolesInWidget = localStorage.getItem('openConsolesInWidget') === 'true' ? true : false;
    if (!localStorage.getItem('symbolScaling')) {
      localStorage.setItem('symbolScaling', 'true');
    }

    if (localStorage.getItem('openReadme')) {
      this.openReadme = localStorage.getItem('openReadme') === 'true' ? true : false;
    } else {
      localStorage.setItem('openReadme', 'false');
    }

    if (localStorage.getItem('showInterfaceLabels')) {
      this.showInterfaceLabels = localStorage.getItem('showInterfaceLabels') === 'true' ? true : false;
    } else {
      localStorage.setItem('showInterfaceLabels', 'true');
    }

    // Project-workspace defaults — read from localStorage, falling back to
    // the GNS3 server defaults the desktop GUI uses for new projects.
    this.defaultSceneWidth = this.readNumber(
      MapSettingsService.SCENE_WIDTH_KEY,
      MapSettingsService.DEFAULT_SCENE_WIDTH
    );
    this.defaultSceneHeight = this.readNumber(
      MapSettingsService.SCENE_HEIGHT_KEY,
      MapSettingsService.DEFAULT_SCENE_HEIGHT
    );
    this.defaultGridSize = this.readNumber(MapSettingsService.GRID_SIZE_KEY, MapSettingsService.DEFAULT_GRID_SIZE);
    this.defaultDrawingGridSize = this.readNumber(
      MapSettingsService.DRAWING_GRID_SIZE_KEY,
      MapSettingsService.DEFAULT_DRAWING_GRID_SIZE
    );
    this.defaultShowGrid = this.readBoolean(MapSettingsService.SHOW_GRID_KEY, MapSettingsService.DEFAULT_SHOW_GRID);
    this.defaultSnapToGrid = this.readBoolean(
      MapSettingsService.SNAP_TO_GRID_KEY,
      MapSettingsService.DEFAULT_SNAP_TO_GRID
    );
    this.defaultLabelStyle = this.readTextStyle(
      MapSettingsService.LABEL_STYLE_KEY,
      this.defaultLabelStyleFallback
    );
    this.defaultNoteStyle = this.readTextStyle(
      MapSettingsService.NOTE_STYLE_KEY,
      this.defaultNoteStyleFallback
    );
    this.defaultLinkStyle = this.readLinkStyle(
      MapSettingsService.LINK_STYLE_KEY,
      this.defaultLinkStyleFallback
    );
  }

  private readNumber(key: string, fallback: number): number {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const parsed = parseInt(stored, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === 'true';
  }

  private readTextStyle(key: string, fallback: WorkspaceTextStyle): WorkspaceTextStyle {
    const stored = localStorage.getItem(key);
    if (!stored) return { ...fallback };
    try {
      return this.normalizeTextStyle(JSON.parse(stored), fallback);
    } catch {
      return { ...fallback };
    }
  }

  private readLinkStyle(key: string, fallback: WorkspaceLinkStyle): WorkspaceLinkStyle {
    const stored = localStorage.getItem(key);
    if (!stored) return { ...fallback };
    try {
      return this.normalizeLinkStyle(JSON.parse(stored), fallback);
    } catch {
      return { ...fallback };
    }
  }

  private normalizeTextStyle(value: unknown, fallback: WorkspaceTextStyle): WorkspaceTextStyle {
    const candidate = typeof value === 'object' && value !== null ? (value as Partial<WorkspaceTextStyle>) : {};
    const fontSize = Number(candidate.fontSize);
    return {
      fontFamily: MapSettingsService.FONT_FAMILIES.includes(candidate.fontFamily)
        ? candidate.fontFamily
        : fallback.fontFamily,
      fontSize: Number.isFinite(fontSize)
        ? Math.min(200, Math.max(1, Math.round(fontSize * 2) / 2))
        : fallback.fontSize,
      fontWeight: MapSettingsService.FONT_WEIGHTS.includes(candidate.fontWeight)
        ? candidate.fontWeight
        : fallback.fontWeight,
      color: this.normalizeColor(candidate.color, fallback.color),
    };
  }

  private normalizeLinkStyle(value: unknown, fallback: WorkspaceLinkStyle): WorkspaceLinkStyle {
    const candidate = typeof value === 'object' && value !== null ? (value as Partial<WorkspaceLinkStyle>) : {};
    const width = Number(candidate.width);
    const type = Number(candidate.type);
    const validLinkTypes = MapSettingsService.LINK_TYPES.map((linkType) => linkType.value);
    return {
      color: this.normalizeColor(candidate.color, fallback.color),
      width: Number.isFinite(width) ? Math.min(20, Math.max(1, Math.round(width))) : fallback.width,
      type:
        Number.isInteger(type) && type >= 0 && type < MapSettingsService.LINK_STYLE_NAMES.length ? type : fallback.type,
      link_type:
        typeof candidate.link_type === 'string' && validLinkTypes.includes(candidate.link_type)
          ? candidate.link_type
          : fallback.link_type,
    };
  }

  private normalizeColor(value: unknown, fallback: string): string {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
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

  getConsoleContextMenuAction(): string {
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

  toggleItemLockStatus(value: boolean) {
    this.isItemLockStatusVisible = value;
  }

  toggleShowInterfaceLabels(value: boolean) {
    this.showInterfaceLabels = value;
    localStorage.removeItem('showInterfaceLabels');
    if (value) {
      localStorage.setItem('showInterfaceLabels', 'true');
    } else {
      localStorage.setItem('showInterfaceLabels', 'false');
    }
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

  toggleOpenConsolesInWidget(value: boolean) {
    this.openConsolesInWidget = value;
    localStorage.removeItem('openConsolesInWidget');
    if (value) {
      localStorage.setItem('openConsolesInWidget', 'true');
    } else {
      localStorage.setItem('openConsolesInWidget', 'false');
    }
  }

  getDefaultSceneWidth(): number {
    return this.defaultSceneWidth;
  }

  setDefaultSceneWidth(value: number) {
    const v = Number.isFinite(value) && value >= 0 ? Math.round(value) : MapSettingsService.DEFAULT_SCENE_WIDTH;
    this.defaultSceneWidth = v;
    localStorage.setItem(MapSettingsService.SCENE_WIDTH_KEY, String(v));
  }

  getDefaultSceneHeight(): number {
    return this.defaultSceneHeight;
  }

  setDefaultSceneHeight(value: number) {
    const v = Number.isFinite(value) && value >= 0 ? Math.round(value) : MapSettingsService.DEFAULT_SCENE_HEIGHT;
    this.defaultSceneHeight = v;
    localStorage.setItem(MapSettingsService.SCENE_HEIGHT_KEY, String(v));
  }

  getDefaultGridSize(): number {
    return this.defaultGridSize;
  }

  setDefaultGridSize(value: number) {
    const v = Number.isFinite(value) && value >= 0 ? Math.round(value) : MapSettingsService.DEFAULT_GRID_SIZE;
    this.defaultGridSize = v;
    localStorage.setItem(MapSettingsService.GRID_SIZE_KEY, String(v));
  }

  getDefaultDrawingGridSize(): number {
    return this.defaultDrawingGridSize;
  }

  setDefaultDrawingGridSize(value: number) {
    const v = Number.isFinite(value) && value >= 0 ? Math.round(value) : MapSettingsService.DEFAULT_DRAWING_GRID_SIZE;
    this.defaultDrawingGridSize = v;
    localStorage.setItem(MapSettingsService.DRAWING_GRID_SIZE_KEY, String(v));
  }

  getDefaultShowGrid(): boolean {
    return this.defaultShowGrid;
  }

  setDefaultShowGrid(value: boolean) {
    this.defaultShowGrid = value;
    localStorage.setItem(MapSettingsService.SHOW_GRID_KEY, value ? 'true' : 'false');
  }

  getDefaultSnapToGrid(): boolean {
    return this.defaultSnapToGrid;
  }

  setDefaultSnapToGrid(value: boolean) {
    this.defaultSnapToGrid = value;
    localStorage.setItem(MapSettingsService.SNAP_TO_GRID_KEY, value ? 'true' : 'false');
  }

  getDefaultLabelStyle(): WorkspaceTextStyle {
    return {
      ...this.defaultLabelStyle,
      color: this.hasDefaultLabelStyle() ? this.defaultLabelStyle.color : this.themeService.getCanvasLabelColor(),
    };
  }

  hasDefaultLabelStyle(): boolean {
    return localStorage.getItem(MapSettingsService.LABEL_STYLE_KEY) !== null;
  }

  setDefaultLabelStyle(value: WorkspaceTextStyle): void {
    this.defaultLabelStyle = this.normalizeTextStyle(value, this.defaultLabelStyleFallback);
    localStorage.setItem(MapSettingsService.LABEL_STYLE_KEY, JSON.stringify(this.defaultLabelStyle));
  }

  getDefaultNoteStyle(): WorkspaceTextStyle {
    return {
      ...this.defaultNoteStyle,
      color: this.hasDefaultNoteStyle() ? this.defaultNoteStyle.color : this.themeService.getCanvasLabelColor(),
    };
  }

  hasDefaultNoteStyle(): boolean {
    return localStorage.getItem(MapSettingsService.NOTE_STYLE_KEY) !== null;
  }

  setDefaultNoteStyle(value: WorkspaceTextStyle): void {
    this.defaultNoteStyle = this.normalizeTextStyle(value, this.defaultNoteStyleFallback);
    localStorage.setItem(MapSettingsService.NOTE_STYLE_KEY, JSON.stringify(this.defaultNoteStyle));
  }

  getDefaultLinkStyle(): WorkspaceLinkStyle {
    return {
      ...this.defaultLinkStyle,
      color: this.hasDefaultLinkStyle() ? this.defaultLinkStyle.color : this.themeService.getCanvasLinkColor(),
    };
  }

  hasDefaultLinkStyle(): boolean {
    return localStorage.getItem(MapSettingsService.LINK_STYLE_KEY) !== null;
  }

  setDefaultLinkStyle(value: WorkspaceLinkStyle): void {
    this.defaultLinkStyle = this.normalizeLinkStyle(value, this.defaultLinkStyleFallback);
    localStorage.setItem(MapSettingsService.LINK_STYLE_KEY, JSON.stringify(this.defaultLinkStyle));
  }
}
