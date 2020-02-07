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

    async clickAddServer() {
        let buttons = await browser.driver.findElements(by.className('mat-button mat-button-base'));
        await buttons[3].click();
    }

    checkServersTable() {
        return browser.driver.findElements(by.css('mat-cell'));
    }
}
