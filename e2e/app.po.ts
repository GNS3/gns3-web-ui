import { browser, by, element } from 'protractor';

export class Gns3WebUiPage {
  navigateTo() {
    return browser.get('/');
  }

  getTitleText() {
    return browser.getTitle();
  }

  getParagraphText() {
    return element(by.css('app-root h1')).getText();
  }
}
