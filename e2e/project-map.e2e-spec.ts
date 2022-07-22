import { TestHelper } from './helpers/common.po';
import { ProjectMapPage } from './helpers/project-map.po';
import { ProjectsPage } from './helpers/project.po';
import { ControllersPage } from './helpers/controller.po';

describe('Project map page', () => {
  let controllersPage: ControllersPage;
  let projectsPage: ProjectsPage;
  let projectMapPage: ProjectMapPage;
  let helper: TestHelper;

  beforeEach(async () => {
    controllersPage = new ControllersPage();
    projectsPage = new ProjectsPage();
    projectMapPage = new ProjectMapPage();
    helper = new TestHelper();

    controllersPage.maximizeWindow();
    await controllersPage.navigateToControllersPage();
    await controllersPage.clickAddController();
    await controllersPage.navigateToControllerProjects();
    await projectsPage.openAddProjectDialog();
    helper.sleep(2000);
    await projectsPage.createProject();
    helper.sleep(2000);
  });

  it('user should have possibility to add nodes to map', async () => {
    // arrange
    projectMapPage.openAddProjectDialog();
    helper.sleep(2000);

    //act
    projectMapPage.addNode();
    helper.sleep(2000);

    //assert
    expect(await projectMapPage.verifyIfNodeWithLabelExists('PC1')).toBe(true);
  });
});
