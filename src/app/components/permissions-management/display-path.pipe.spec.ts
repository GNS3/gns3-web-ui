import {async, fakeAsync, TestBed, tick} from "@angular/core/testing";
import {DisplayPathPipe} from "@components/permissions-management/display-path.pipe";
import {ApiInformationService} from "@services/ApiInformation/api-information.service";
import {Server} from "@models/server";
import {Observable, of} from "rxjs";
import {IExtraParams} from "@services/ApiInformation/IExtraParams";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

class MockApiInformationService {

}


fdescribe('DisplayPathPipe', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        DisplayPathPipe,
        {provide: ApiInformationService, useClass: MockApiInformationService}]
    });
  }));

  it('Should display human readable path', fakeAsync(() => {
    const comp = TestBed.inject(DisplayPathPipe);
    const apiService = TestBed.inject(ApiInformationService);

    apiService.getKeysForPath = (path: string): Observable<{ key: string; value: string }[]> => {
      return of([
        {key: 'project_id', value: '1111-2222-3333'},
        {key: 'node_id', value: '2222-2222-2222'}
      ]);
    };

    apiService
      .getListByObjectId = (server: Server, key: string, value?: string, extraParams?: IExtraParams[]): Observable<IGenericApiObject[]> => {
      if (key === 'project_id') {
        return of([{id: '1111-2222-3333', name: 'myProject'}]);
      }
      if (key === 'node_id') {
        return of([{id: '2222-2222-2222', name: 'node1'}]);
      }
    };

    let result: string;

    const server = new Server();
    comp
      .transform('/project/1111-2222-3333/nodes/2222-2222-2222', server)
      .subscribe((res: string) => {
        result = res;
      });

    tick();
    expect(result).toEqual('/project/myProject/nodes/node1');
  }));
});
