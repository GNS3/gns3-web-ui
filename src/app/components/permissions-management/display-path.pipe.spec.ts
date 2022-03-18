import { DisplayPathPipe } from './display-path.pipe';
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {ApiInformationService} from "../../services/ApiInformation/api-information.service";
import {Observable, of} from "rxjs";
import {getTestServer} from "@services/testing";
import {Server} from "@models/server";

describe('DisplayPathPipe', () => {
  let pipe: DisplayPathPipe;
  let apiInfoServiceSpy: jasmine.SpyObj<ApiInformationService>;
  let server: Server;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiInformationService', ['getKeysForPath', 'getListByObjectId']);

    TestBed.configureTestingModule({
      providers: [DisplayPathPipe, {provide: ApiInformationService, useValue: spy}],
    });
    pipe = TestBed.inject(DisplayPathPipe);
    apiInfoServiceSpy = TestBed.inject(ApiInformationService) as jasmine.SpyObj<ApiInformationService>;

    server = getTestServer();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('Should return path with project name if it exists',fakeAsync(() => {
    let res: string;
    const mockGetKeysForPath = [{key: '{project_id}', value: 'idtralala'}]
    const mockGetListByObjectId = [{id: 'idtralala', name: 'tralala-project'}]
    apiInfoServiceSpy.getKeysForPath.and.returnValue(of(mockGetKeysForPath))
    apiInfoServiceSpy.getListByObjectId.and.returnValue(of(mockGetListByObjectId))

    pipe.transform('/project/idtralala', server).subscribe(data => {
      res = data;
    });
    tick();
    expect(res)
      .toBe('/project/tralala-project');

  }));

  it('Should return original path', fakeAsync(() => {
    let res: string;
    const mockGetKeysForPath = []
    const mockGetListByObjectId = [{id: 'idtralala', name: 'tralala-project'}]
    apiInfoServiceSpy.getKeysForPath.and.returnValue(of(mockGetKeysForPath))
    apiInfoServiceSpy.getListByObjectId.and.returnValue(of(mockGetListByObjectId))

    pipe.transform('/project/idtralala', server).subscribe(data => {
      res = data;
    });
    tick();
    expect(res)
      .toBe('/project/idtralala');
  }));


});
