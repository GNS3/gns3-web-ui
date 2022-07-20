import { TestHelper } from './helpers/common.po';
import { ProjectsPage } from './helpers/project.po';
import { ServersPage } from './helpers/server.po';

describe('Projects page', () => {
  let controllersPage: ServersPage;
  let projectsPage: ProjectsPage;
  let helper: TestHelper;

  beforeEach(() => {
    controllersPage = new ServersPage();
    projectsPage = new ProjectsPage();
    helper = new TestHelper();
  });

  it('user should have possibility to create new project', async () => {
    // arrange
    controllersPage.maximizeWindow();
    await controllersPage.navigateToServersPage();
    await controllersPage.clickAddServer();
    await controllersPage.navigateToServerProjects();
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
