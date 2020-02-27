import { TestHelper } from "./common.po"
import { browser, by } from "protractor";

export class ProjectMapPage {
    helper = new TestHelper();

    async openAddProjectDialog() {
        let addButton = await browser.driver.findElement(by.css('button.addNode'));
        await addButton.click();
    }

    async addNode() {
        let inputs = await browser.driver.findElements(by.css('input.mat-input-element'));
        await inputs[0].sendKeys('VPCS');
        this.helper.sleep(1000);

        let selects = await browser.driver.findElements(by.css('mat-select.mat-select'));
        await selects[1].click();
        this.helper.sleep(1000);

        let options = await browser.driver.findElements(by.css('mat-option.mat-option'));
        await options[1].click(); //first option should be chosen
        this.helper.sleep(1000);

        // new select appears after refreshing data
        selects = await browser.driver.findElements(by.css('mat-select.mat-select'));
        if (selects[2]) {
            await selects[2].click();
            this.helper.sleep(1000);
    
            options = await browser.driver.findElements(by.css('mat-option.mat-option'));
            await options[0].click();
            this.helper.sleep(1000);
        }

        let addButton = await browser.driver.findElement(by.css('button.addButton'));
        await addButton.click();
        this.helper.sleep(1000);
    }

    async verifyIfNodeWithLabelExists(labelToFind: string) {
        this.helper.sleep(5000);
        let nodeLabel = await browser.driver.findElement(by.css('#map > g > g.layer > g.nodes > g > g > g > g > text'));
        let selectedNode;
        let textFromNodeLabel = await nodeLabel.getText();
        if (textFromNodeLabel == labelToFind) selectedNode = nodeLabel;

        return selectedNode ? true : false;
    }
}
