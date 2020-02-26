import { browser, by, element } from 'protractor';
import { TestHelper } from './common.po';

export class ServersPage {
    helper = new TestHelper;

    maximizeWindow() {
        browser.driver.manage().window().maximize();
    }

    navigateToServersPage() {
        return browser.get('/servers');
    }

    getAddServerNotificationText() {
        return browser.driver.findElement(by.className('mat-card-content')).getText();
    }

    async clickAddServer() {
        let buttons = await browser.driver.findElements(by.className('mat-button mat-button-base'));
        await buttons[3].click();
    }

    checkServersTable() {
        return browser.driver.findElements(by.css('mat-cell'));
    }

    async navigateToServerProjects() {
        this.helper.sleep(2000);
        let hyperlinks = await browser.driver.findElements(by.css('a.table-link'));
        let serverLink;
        await this.helper.asyncForEach(hyperlinks, async element => {
            let text = await element.getText();
            if (text === '127.0.0.1') serverLink = element;
        });
        await serverLink.click();
    }
}
