import { Gns3WebUiPage } from './app.po';

describe('gns3-web-ui App', () => {
  let page: Gns3WebUiPage;

  beforeEach(() => {
    page = new Gns3WebUiPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
