import { Injectable } from '@angular/core';
import { NotificationSettings } from '../models/notification-settings-models/notification-settings';

@Injectable()
export class NotificationSettingsService {

  constructor() {}

  getConfiguration(): NotificationSettings {
    let configuration: NotificationSettings = {
        delayTime: 1000,
        viewTime: 1000,
        breakTime: 10,
        isEndless: true,
        numberOfViews: 1,
    };

    return configuration;
  }
}
