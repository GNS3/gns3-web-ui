import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../environments/environment';
declare var gtag: Function;

@Injectable()
export class GoogleAnalyticsService {
  constructor(router: Router) {
    if (!environment.production) return;
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        gtag('set', 'page', event.url);
        gtag('send', 'pageview');
      }
    });
  }
}
