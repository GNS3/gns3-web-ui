import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { MapSettingsService } from '@services/mapsettings.service';
import { Settings, SettingsService } from '@services/settings.service';
import { ConsoleService } from '@services/settings/console.service';
import { ThemeService, PrebuiltTheme } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { UpdatesService } from '@services/updates.service';
import { ControllerService } from '@services/controller.service';
import { AiChatService } from '@services/ai-chat.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [CommonModule, FormsModule, MatExpansionModule, MatCheckboxModule, MatButtonModule, MatRadioModule, MatProgressSpinnerModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private toaster = inject(ToasterService);
  private themeService = inject(ThemeService);
  public mapSettingsService = inject(MapSettingsService);
  public updatesService = inject(UpdatesService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private aiChatService = inject(AiChatService);

  settings: Settings;
  readonly integrateLinksLabelsToLinks = model(false);
  readonly openReadme = model(false);
  readonly openConsolesInWidget = model(false);
  readonly crashReports = model(false);
  readonly anonymousStatistics = model(false);
  readonly isLoadingAiSkills = signal(false);
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
    this.mapTheme = this.themeService.savedMapTheme;
    this.currentTheme = this.themeService.getCurrentTheme();
    this.cdr.markForCheck();
  }

  save() {
    this.settings.crash_reports = this.crashReports();
    this.settings.anonymous_statistics = this.anonymousStatistics();
    this.settingsService.setAll(this.settings);
    this.toaster.success('Settings have been saved.');

    this.mapSettingsService.toggleIntegrateInterfaceLabels(this.integrateLinksLabelsToLinks());
    this.mapSettingsService.toggleOpenReadme(this.openReadme());
    this.mapSettingsService.toggleOpenConsolesInWidget(this.openConsolesInWidget());
  }

  setTheme(theme: PrebuiltTheme) {
    this.themeService.setTheme(theme);
    this.currentTheme = theme;
    this.cdr.markForCheck();
  }

  setMapTheme(theme: string) {
    this.mapTheme = theme;
    this.themeService.setMapTheme(theme as 'light' | 'dark' | 'auto');
    this.cdr.markForCheck();
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
