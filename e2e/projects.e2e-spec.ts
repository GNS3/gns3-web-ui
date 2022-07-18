import { TestHelper } from './helpers/common.po';
import { ProjectsPage } from './helpers/project.po';
import { ServersPage } from './helpers/server.po';

describe('Projects page', () => {
  let serversPage: ServersPage;
  let projectsPage: ProjectsPage;
  let helper: TestHelper;

  beforeEach(() => {
    serversPage = new ServersPage();
    projectsPage = new ProjectsPage();
    helper = new TestHelper();
  });

  it('user should have possibility to create new project', async () => {
    // arrange
    serversPage.maximizeWindow();
    await serversPage.navigateToServersPage();
    await serversPage.clickAddServer();
    await serversPage.navigateToServerProjects();
    helper.sleep(2000);

    //act
    await projectsPage.openAddProjectDialog();
    helper.sleep(2000);
    await projectsPage.createProject();
    helper.sleep(2000);

    //assert
    expect(helper.getCurrentUrl()).toMatch('controller/1/project/');
  });
});
