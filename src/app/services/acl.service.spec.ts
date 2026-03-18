import { AclService } from './acl.service';
import {HttpController} from "@services/http-controller.service";

class FakeHttpController {

}

describe('AclService', () => {
  let service: AclService;


  it('should be created', () => {
    const service = new AclService(new FakeHttpController() as HttpController);
    expect(service).toBeTruthy();
  });
});
