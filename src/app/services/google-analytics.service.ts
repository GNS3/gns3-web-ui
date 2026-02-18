import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { SettingsService } from './settings.service';
declare var gtag: Function;

@Injectable()
export class GoogleAnalyticsService {
  private settingsService: SettingsService;

  constructor(router: Router, settingsService: SettingsService) {
    if (!environment.production) return;
    router.events.subscribe((event) => {
      if (settingsService.getStatisticsSettings() && event instanceof NavigationEnd) {
        gtag('set', 'page', event.url);
        gtag('send', 'pageview');
      }
    });
  }
}
