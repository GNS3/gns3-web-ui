import { ServersPage } from './helpers/server.po';
import { TestHelper } from './helpers/common.po';
import { element } from 'protractor';

describe('Servers page', () => {
    let page: ServersPage;
    let helper: TestHelper;

    beforeEach(() => {
        page = new ServersPage();
        helper = new TestHelper();
    });

    it('user should have possibility to add server', async () => {
        // arrange
        page.maximizeWindow();
        await page.navigateToServersPage();

        // act
        let text = await page.getAddServerNotificationText();

        // assert
        expect(text).toBe("We've discovered GNS3 server on 127.0.0.1:3080, would you like to add to the list?");
    });

    it('user should see added server in the list', async () => {
        // arrange
        page.maximizeWindow();
        await page.navigateToServersPage();
        await page.clickAddServer();
        helper.sleep(1000);

        // act
        let firstRowOfServersTable = await page.checkServersTable();
        let serverData = [];
        await helper.asyncForEach(firstRowOfServersTable, async element => {
            serverData.push(await element.getText());
        });

        // assert
        expect(serverData).toContain('127.0.0.1');
        expect(serverData).toContain('3080');
    });
});
