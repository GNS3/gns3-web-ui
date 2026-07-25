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
import { ActivatedRoute, CanDeactivateFn } from '@angular/router';
import { MapSettingsService } from '@services/mapsettings.service';
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
  | 'interfaceDensity';

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
    this.dirtyFields.clear();
    this.isDirty.set(false);
    this.toaster.success('Settings saved');
  }

  private markDirty(field: SettingsField): void {
    this.dirtyFields.add(field);
    this.isDirty.set(true);
  }

  canDeactivate(): boolean {
    return !this.isDirty() || window.confirm('You have unsaved settings. Leave without saving them?');
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

export const canDeactivateSettings: CanDeactivateFn<SettingsComponent> = (component) => component.canDeactivate();
