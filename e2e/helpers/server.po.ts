import { browser, by, element } from 'protractor';

export class ServersPage {
    maximizeWindow() {
        browser.driver.manage().window().maximize();
    }

    navigateToServersPage() {
        return browser.get('/servers');
    }

    getAddServerNotificationText() {
        return browser.driver.findElement(by.className('mat-card-content')).getText();
        // return element(by.className('mat-card-content')[0]).getText();
    }

    checkServersTable() {
        return browser.driver.findElement(by.className('mat-cell cdk-column-id mat-column-id ng-star-inserted')).getText();
    }
}
