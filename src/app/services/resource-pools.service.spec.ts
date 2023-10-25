import {ResourcePoolsService} from "@services/resource-pools.service";
import {HttpController} from "@services/http-controller.service";
import {ProjectService} from "@services/project.service";

class  FakeHttpController {

}

class FakeProjectService {

}

describe('ResourcePoolsService', () => {


  it('should be created', () => {
    const service = new ResourcePoolsService(
      new FakeHttpController() as HttpController,
      new FakeProjectService() as ProjectService)
    expect(service).toBeTruthy();
  });
});
