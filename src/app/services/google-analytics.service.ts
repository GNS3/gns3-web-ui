
import { Injectable } from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import { environment } from '../../environments/environment';
declare var ga:Function;

@Injectable()
export class GoogleAnalyticsService {

  constructor(router: Router) {
    if (!environment.production) return;
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        ga('set', 'page', event.url);
        ga('send', 'pageview');
      }
    })
  }

}
