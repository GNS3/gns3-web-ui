import { browser, by } from 'protractor';
import { TestHelper } from './common.po';

export class ProjectsPage {
  helper = new TestHelper();

  async openAddProjectDialog() {
    let addButton = await browser.driver.findElement(by.css('button.add-button'));
    await addButton.click();
  }

  async createProject() {
    let today = new Date();
    let inputs = await browser.driver.findElements(by.css('input.mat-input-element'));
    await inputs[1].sendKeys('test project ' + today.getUTCMilliseconds());
    this.helper.sleep(2000);
    let dialogButton = await browser.driver.findElement(by.css('button.add-project-button'));
    await dialogButton.click();
  }
}
