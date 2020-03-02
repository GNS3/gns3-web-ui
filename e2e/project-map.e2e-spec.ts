import { ServersPage } from './helpers/server.po';
import { TestHelper } from './helpers/common.po';
import { element } from 'protractor';
import { ProjectsPage } from './helpers/project.po';
import { ProjectMapPage } from './helpers/project-map.po';

describe('Project map page', () => {
    let serversPage: ServersPage;
    let projectsPage: ProjectsPage;
    let projectMapPage: ProjectMapPage;
    let helper: TestHelper;

    beforeEach(async () => {
        serversPage = new ServersPage();
        projectsPage = new ProjectsPage();
        projectMapPage = new ProjectMapPage();
        helper = new TestHelper();

        serversPage.maximizeWindow();
        await serversPage.navigateToServersPage();
        await serversPage.clickAddServer();
        await serversPage.navigateToServerProjects();
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
