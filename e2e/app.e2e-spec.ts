import { Gns3WebUiPage } from './app.po';

describe('gns3-web-ui App', () => {
  let page: Gns3WebUiPage;

  beforeEach(() => {
    page = new Gns3WebUiPage();
  });

  it('should display title', () => {
    page.navigateTo();
    expect(page.getTitleText()).toEqual('GNS3 Web UI Demo');
  });
});
