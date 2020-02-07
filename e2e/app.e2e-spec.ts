import { Gns3WebUiPage } from './app.po';

describe('GNS3 Web UI Application', () => {
  let page: Gns3WebUiPage;

  beforeEach(() => {
    page = new Gns3WebUiPage();
  });

  it('should have correct page title', async () => {
    // arrange
    await page.navigateTo();
    
    // act
    let text = await page.getTitleText();

    // assert
    expect(text).toEqual('GNS3 Web UI');
  });
});
