import { Injectable } from '@angular/core';
import { NotificationSettings } from '../models/notification-settings-models/notification-settings';

@Injectable()
export class NotificationSettingsService {

  constructor() {}

  getConfiguration(): NotificationSettings {
    let configuration: NotificationSettings = {
        delayTime: 0,
        viewTime: 1000,
        breakTime: 1000,
        isEndless: true,
        numberOfViews: 1,
    };

    return configuration;
  }
}
