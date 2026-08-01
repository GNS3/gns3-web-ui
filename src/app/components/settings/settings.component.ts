import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  inject,
  model,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { MapSettingsService, WorkspaceLinkStyle, WorkspaceTextStyle } from '@services/mapsettings.service';
import { Settings, SettingsService } from '@services/settings.service';
import { ConsoleService } from '@services/settings/console.service';
import { ThemeService, PrebuiltTheme } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { UpdatesService } from '@services/updates.service';
import { ControllerService } from '@services/controller.service';
import { AiChatService } from '@services/ai-chat.service';
import { InterfaceDensity, InterfaceDensityService } from '@services/interface-density.service';

type SettingsCategory = 'general' | 'appearance' | 'workspace' | 'console' | 'privacy' | 'updates' | 'ai';
type SettingsField =
  | 'crashReports'
  | 'anonymousStatistics'
  | 'integrateLinkLabels'
  | 'openReadme'
  | 'openConsolesInWidget'
  | 'consoleCommand'
  | 'theme'
  | 'mapTheme'
  | 'interfaceDensity'
  | 'defaultSceneWidth'
  | 'defaultSceneHeight'
  | 'defaultGridSize'
  | 'defaultDrawingGridSize'
  | 'defaultShowGrid'
  | 'defaultSnapToGrid'
  | 'defaultLabelStyle'
  | 'defaultNoteStyle'
  | 'defaultLinkStyle';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private consoleService = inject(ConsoleService);
  private toaster = inject(ToasterService);
  private themeService = inject(ThemeService);
  public mapSettingsService = inject(MapSettingsService);
  public updatesService = inject(UpdatesService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private aiChatService = inject(AiChatService);
  private interfaceDensityService = inject(InterfaceDensityService);

  settings: Settings;
  readonly integrateLinksLabelsToLinks = model(false);
  readonly openReadme = model(false);
  readonly openConsolesInWidget = model(false);
  readonly crashReports = model(false);
  readonly anonymousStatistics = model(false);
  readonly consoleCommand = model('');
  readonly isLoadingAiSkills = signal(false);
  readonly isDirty = signal(false);
  readonly activeCategory = signal<SettingsCategory>('general');
  readonly interfaceDensity = signal<InterfaceDensity>('normal');

  // Default project-workspace values — seeded from MapSettingsService
  // (localStorage-backed, the same store the GNS3 desktop GUI persists
  // these per-user workspace defaults to) and written back to it on save.
  // Defaults shown here mirror the GNS3 server project defaults
  // (scene_width 2000, scene_height 1000, grid_size 75, drawing_grid_size 25,
  // show_grid false, snap_to_grid false) — see Project model / fixtures.
  readonly defaultSceneWidth = model(2000);
  readonly defaultSceneHeight = model(1000);
  readonly defaultGridSize = model(75);
  readonly defaultDrawingGridSize = model(25);
  readonly defaultShowGrid = model(false);
  readonly defaultSnapToGrid = model(false);
  readonly defaultLabelStyle = model<WorkspaceTextStyle>(this.mapSettingsService.getDefaultLabelStyle());
  readonly defaultNoteStyle = model<WorkspaceTextStyle>(this.mapSettingsService.getDefaultNoteStyle());
  readonly defaultLinkStyle = model<WorkspaceLinkStyle>(this.mapSettingsService.getDefaultLinkStyle());
  readonly fontFamilies = MapSettingsService.FONT_FAMILIES;
  readonly fontWeights = MapSettingsService.FONT_WEIGHTS;
  readonly linkStyleNames = MapSettingsService.LINK_STYLE_NAMES;
  readonly linkTypes = MapSettingsService.LINK_TYPES;
  readonly categories: { id: SettingsCategory; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: 'tune' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'workspace', label: 'Project workspace', icon: 'account_tree' },
    { id: 'console', label: 'Console', icon: 'terminal' },
    { id: 'privacy', label: 'Privacy and diagnostics', icon: 'shield' },
    { id: 'updates', label: 'Updates', icon: 'system_update' },
    { id: 'ai', label: 'AI', icon: 'auto_awesome' },
  ];
  private readonly dirtyFields = new Set<SettingsField>();
  mapTheme: string;
  currentTheme: PrebuiltTheme;
  availableThemes = this.themeService.availableThemes;
  availableMapBackgrounds = this.themeService.availableMapBackgrounds;

  get lightThemes() {
    return this.themeService.availableThemes.filter((t) => t.type === 'light');
  }

  get darkThemes() {
    return this.themeService.availableThemes.filter((t) => t.type === 'dark');
  }

  get lightMapBackgrounds() {
    return this.themeService.availableMapBackgrounds.filter((bg) => bg.type === 'light' && bg.key !== 'auto');
  }

  get darkMapBackgrounds() {
    return this.themeService.availableMapBackgrounds.filter((bg) => bg.type === 'dark');
  }

  get autoMapBackground() {
    return this.themeService.availableMapBackgrounds.find((bg) => bg.key === 'auto');
  }

  ngOnInit() {
    this.settings = this.settingsService.getAll();
    this.integrateLinksLabelsToLinks.set(this.mapSettingsService.integrateLinkLabelsToLinks);
    this.openReadme.set(this.mapSettingsService.openReadme);
    this.openConsolesInWidget.set(this.mapSettingsService.openConsolesInWidget);
    this.crashReports.set(this.settings.crash_reports);
    this.anonymousStatistics.set(this.settings.anonymous_statistics);
    this.consoleCommand.set(this.consoleService.command);
    this.mapTheme = this.themeService.savedMapTheme;
    this.currentTheme = this.themeService.getCurrentTheme();
    this.interfaceDensity.set(this.interfaceDensityService.getDensity());

    // Project-workspace defaults — seeded from the localStorage-backed
    // MapSettingsService (the same store existing workspace prefs use).
    this.defaultSceneWidth.set(this.mapSettingsService.getDefaultSceneWidth());
    this.defaultSceneHeight.set(this.mapSettingsService.getDefaultSceneHeight());
    this.defaultGridSize.set(this.mapSettingsService.getDefaultGridSize());
    this.defaultDrawingGridSize.set(this.mapSettingsService.getDefaultDrawingGridSize());
    this.defaultShowGrid.set(this.mapSettingsService.getDefaultShowGrid());
    this.defaultSnapToGrid.set(this.mapSettingsService.getDefaultSnapToGrid());
    this.cdr.markForCheck();
  }

  selectCategory(category: SettingsCategory): void {
    this.activeCategory.set(category);
  }

  setCrashReports(enabled: boolean): void {
    if (this.crashReports() === enabled) return;
    this.crashReports.set(enabled);
    this.markDirty('crashReports');
  }

  setAnonymousStatistics(enabled: boolean): void {
    if (this.anonymousStatistics() === enabled) return;
    this.anonymousStatistics.set(enabled);
    this.markDirty('anonymousStatistics');
  }

  setIntegrateLinkLabels(enabled: boolean): void {
    if (this.integrateLinksLabelsToLinks() === enabled) return;
    this.integrateLinksLabelsToLinks.set(enabled);
    this.markDirty('integrateLinkLabels');
  }

  setOpenReadme(enabled: boolean): void {
    if (this.openReadme() === enabled) return;
    this.openReadme.set(enabled);
    this.markDirty('openReadme');
  }

  setOpenConsolesInWidget(enabled: boolean): void {
    if (this.openConsolesInWidget() === enabled) return;
    this.openConsolesInWidget.set(enabled);
    this.markDirty('openConsolesInWidget');
  }

  setConsoleCommand(command: string): void {
    if (this.consoleCommand() === command) return;
    this.consoleCommand.set(command);
    this.markDirty('consoleCommand');
  }

  setTheme(theme: PrebuiltTheme) {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    this.markDirty('theme');
    this.cdr.markForCheck();
  }

  setMapTheme(theme: string) {
    if (this.mapTheme === theme) return;
    this.mapTheme = theme;
    this.markDirty('mapTheme');
    this.cdr.markForCheck();
  }

  setInterfaceDensity(density: InterfaceDensity): void {
    if (this.interfaceDensity() === density) return;
    this.interfaceDensity.set(density);
    this.markDirty('interfaceDensity');
  }

  setDefaultSceneWidth(value: number): void {
    const v = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    if (this.defaultSceneWidth() === v) return;
    this.defaultSceneWidth.set(v);
    this.markDirty('defaultSceneWidth');
  }

  setDefaultSceneHeight(value: number): void {
    const v = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    if (this.defaultSceneHeight() === v) return;
    this.defaultSceneHeight.set(v);
    this.markDirty('defaultSceneHeight');
  }

  setDefaultGridSize(value: number): void {
    const v = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    if (this.defaultGridSize() === v) return;
    this.defaultGridSize.set(v);
    this.markDirty('defaultGridSize');
  }

  setDefaultDrawingGridSize(value: number): void {
    const v = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    if (this.defaultDrawingGridSize() === v) return;
    this.defaultDrawingGridSize.set(v);
    this.markDirty('defaultDrawingGridSize');
  }

  setDefaultShowGrid(enabled: boolean): void {
    if (this.defaultShowGrid() === enabled) return;
    this.defaultShowGrid.set(enabled);
    this.markDirty('defaultShowGrid');
  }

  setDefaultSnapToGrid(enabled: boolean): void {
    if (this.defaultSnapToGrid() === enabled) return;
    this.defaultSnapToGrid.set(enabled);
    this.markDirty('defaultSnapToGrid');
  }

  setDefaultLabelStyle(value: Partial<WorkspaceTextStyle>): void {
    const current = this.defaultLabelStyle();
    const next = this.mergeTextStyle(current, value);
    if (this.stylesEqual(current, next)) return;
    this.defaultLabelStyle.set(next);
    this.markDirty('defaultLabelStyle');
  }

  setDefaultNoteStyle(value: Partial<WorkspaceTextStyle>): void {
    const current = this.defaultNoteStyle();
    const next = this.mergeTextStyle(current, value);
    if (this.stylesEqual(current, next)) return;
    this.defaultNoteStyle.set(next);
    this.markDirty('defaultNoteStyle');
  }

  setDefaultLinkStyle(value: Partial<WorkspaceLinkStyle>): void {
    const current = this.defaultLinkStyle();
    const width =
      value.width !== undefined && Number.isFinite(value.width)
        ? Math.min(20, Math.max(1, Math.round(value.width)))
        : current.width;
    const next = { ...current, ...value, width };
    if (this.stylesEqual(current, next)) return;
    this.defaultLinkStyle.set(next);
    this.markDirty('defaultLinkStyle');
  }

  private mergeTextStyle(current: WorkspaceTextStyle, value: Partial<WorkspaceTextStyle>): WorkspaceTextStyle {
    const fontSize =
      value.fontSize !== undefined && Number.isFinite(value.fontSize)
        ? Math.min(200, Math.max(1, Math.round(value.fontSize * 2) / 2))
        : current.fontSize;
    return { ...current, ...value, fontSize };
  }

  private stylesEqual<T extends object>(first: T, second: T): boolean {
    return Object.keys(first).every((key) => first[key] === second[key]);
  }

  saveSettings(): void {
    this.settings = {
      ...this.settings,
      crash_reports: this.crashReports(),
      anonymous_statistics: this.anonymousStatistics(),
      console_command: this.consoleCommand(),
    };
    if (
      this.dirtyFields.has('crashReports') ||
      this.dirtyFields.has('anonymousStatistics') ||
      this.dirtyFields.has('consoleCommand')
    ) {
      this.settingsService.setAll(this.settings);
    }
    if (this.dirtyFields.has('consoleCommand')) {
      this.consoleService.command = this.consoleCommand();
    }
    if (this.dirtyFields.has('integrateLinkLabels')) {
      this.mapSettingsService.toggleIntegrateInterfaceLabels(this.integrateLinksLabelsToLinks());
    }
    if (this.dirtyFields.has('openReadme')) {
      this.mapSettingsService.toggleOpenReadme(this.openReadme());
    }
    if (this.dirtyFields.has('openConsolesInWidget')) {
      this.mapSettingsService.toggleOpenConsolesInWidget(this.openConsolesInWidget());
    }
    if (this.dirtyFields.has('theme')) {
      this.themeService.setTheme(this.currentTheme);
    }
    if (this.dirtyFields.has('mapTheme')) {
      this.themeService.setMapTheme(this.mapTheme as 'light' | 'dark' | 'auto');
    }
    if (this.dirtyFields.has('interfaceDensity')) {
      this.interfaceDensityService.setDensity(this.interfaceDensity());
    }

    // Project-workspace defaults — persisted to localStorage via
    // MapSettingsService (same store existing workspace prefs like
    // openReadme / integrateLinkLabelsToLinks use). The GNS3 web-friendly
    // controller has no /settings endpoint with Graphicsview, so these
    // defaults live client-side and seed new projects when created.
    if (this.dirtyFields.has('defaultSceneWidth')) {
      this.mapSettingsService.setDefaultSceneWidth(this.defaultSceneWidth());
    }
    if (this.dirtyFields.has('defaultSceneHeight')) {
      this.mapSettingsService.setDefaultSceneHeight(this.defaultSceneHeight());
    }
    if (this.dirtyFields.has('defaultGridSize')) {
      this.mapSettingsService.setDefaultGridSize(this.defaultGridSize());
    }
    if (this.dirtyFields.has('defaultDrawingGridSize')) {
      this.mapSettingsService.setDefaultDrawingGridSize(this.defaultDrawingGridSize());
    }
    if (this.dirtyFields.has('defaultShowGrid')) {
      this.mapSettingsService.setDefaultShowGrid(this.defaultShowGrid());
    }
    if (this.dirtyFields.has('defaultSnapToGrid')) {
      this.mapSettingsService.setDefaultSnapToGrid(this.defaultSnapToGrid());
    }
    if (this.dirtyFields.has('defaultLabelStyle')) {
      this.mapSettingsService.setDefaultLabelStyle(this.defaultLabelStyle());
    }
    if (this.dirtyFields.has('defaultNoteStyle')) {
      this.mapSettingsService.setDefaultNoteStyle(this.defaultNoteStyle());
    }
    if (this.dirtyFields.has('defaultLinkStyle')) {
      this.mapSettingsService.setDefaultLinkStyle(this.defaultLinkStyle());
    }

    this.dirtyFields.clear();
    this.isDirty.set(false);
    this.toaster.success('Settings saved');
  }

  private markDirty(field: SettingsField): void {
    this.dirtyFields.add(field);
    this.isDirty.set(true);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  checkForUpdates() {
    window.open('https://gns3.com/software');
  }

  checkForAiSkillsUpdates() {
    const controllerId = this.route.snapshot.paramMap.get('controller_id');
    if (!controllerId) {
      this.toaster.error('Controller not found');
      return;
    }

    this.isLoadingAiSkills.set(true);

    this.controllerService.get(+controllerId).then((controller) => {
      this.aiChatService.reloadSkills(controller).subscribe({
        next: () => {
          this.toaster.success('AI skills reloaded successfully');
          this.isLoadingAiSkills.set(false);
        },
        error: (error) => {
          const message = error?.error?.message || error?.message || 'Failed to reload AI skills';
          this.toaster.error(message);
          this.isLoadingAiSkills.set(false);
        },
      });
    });
  }
}
