import { TestHelper } from './helpers/common.po';
import { ControllersPage } from './helpers/server.po';

describe('Servers page', () => {
  let page: ControllersPage;
  let helper: TestHelper;

  beforeEach(() => {
    page = new ControllersPage();
    helper = new TestHelper();
  });

  xit('user should have possibility to add controller', async () => {
    // arrange
    page.maximizeWindow();
    await page.navigateToControllersPage();

    // act
    let text = await page.getAddControllerNotificationText();

    // assert
    expect(text).toBe("We've discovered GNS3 controller on 127.0.0.1:3080, would you like to add to the list?");
  });

  it('user should see added controller in the list', async () => {
    // arrange
    page.maximizeWindow();
    await page.navigateToControllersPage();
    await page.clickAddController();
    helper.sleep(1000);

    // act
    let firstRowOfServersTable = await page.checkControllersTable();
    let serverData = [];
    await helper.asyncForEach(firstRowOfServersTable, async (element) => {
      serverData.push(await element.getText());
    });

    // assert
    expect(serverData).toContain('127.0.0.1');
    expect(serverData).toContain('3080');
  });
});
