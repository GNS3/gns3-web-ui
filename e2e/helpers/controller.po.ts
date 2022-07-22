import { browser, by } from 'protractor';
import { TestHelper } from './common.po';

export class ControllersPage {
  helper = new TestHelper();

  maximizeWindow() {
    browser.driver.manage().window().maximize();
  }

  navigateToControllersPage() {
    return browser.get('/controllers');
  }

  getAddControllerNotificationText() {
    return browser.driver.findElement(by.className('mat-card-content')).getText();
  }

  async clickAddController() {
    let controllerTable = await this.checkControllersTable();
    if (controllerTable.length === 0) {
      let buttons = await browser.driver.findElements(by.className('mat-button mat-button-base'));
      await buttons[3].click();
    }
  }

  checkControllersTable() {
    return browser.driver.findElements(by.css('mat-cell'));
  }

  async navigateToControllerProjects() {
    this.helper.sleep(2000);
    let hyperlinks = await browser.driver.findElements(by.css('a.table-link'));
    let controllerLink;
    await this.helper.asyncForEach(hyperlinks, async (element) => {
      let text = await element.getText();
      if (text === '127.0.0.1') controllerLink = element;
    });
    await controllerLink.click();
  }
}