import { TestBed } from '@angular/core/testing';

import { ResourcePoolsResolver } from './resource-pools.resolver';
import {ControllerService} from "@services/controller.service";
import {HttpController} from "@services/http-controller.service";
import {ProjectService} from "@services/project.service";

class FakeControllerService {

}

class FakeHttpController {

}

class FakeProjectService {}

describe('ResourcePoolsResolver', () => {
  let resolver: ResourcePoolsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ControllerService, useClass: FakeControllerService},
        {provide: HttpController, useClass: FakeHttpController},
        {provide: ProjectService, useClass: FakeProjectService}
      ]});
    resolver = TestBed.inject(ResourcePoolsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
