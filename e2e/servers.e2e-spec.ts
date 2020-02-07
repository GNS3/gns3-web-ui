import { ServersPage } from './helpers/server.po';

describe('gns3-web-ui App', () => {
    let page: ServersPage;

    beforeEach(() => {
        page = new ServersPage();
    });

    it('should be able to add server', async () => {
        // arrange
        page.maximizeWindow();
        await page.navigateToServersPage();

        // act
        let text = await page.getAddServerNotificationText();

        // assert
        expect(text).toBe("We've discovered GNS3 server on 127.0.0.1:3080, would you like to add to the list?");

        // let firstRowOfServersTable = await page.checkServersTable();

        // console.log('answer ********************* ', firstRowOfServersTable);

        // expect(true).toBe(true);
    });
});
