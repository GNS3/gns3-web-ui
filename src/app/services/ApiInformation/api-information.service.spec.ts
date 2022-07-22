import {ApiInformationService, IPathDict} from "@services/ApiInformation/api-information.service";
import {HttpClient} from "@angular/common/http";
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {DisplayPathPipe} from "@components/permissions-management/display-path.pipe";
import {Observable, of, ReplaySubject} from "rxjs";
import {Server} from "@models/server";
import {getTestServer} from "@services/testing";
import {Methods} from "@models/api/permission";
import {ApiInformationCache} from "@services/ApiInformation/ApiInformationCache";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

describe('ApiInformationService', () => {
  let apiService: ApiInformationService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let server: Server;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get']);
    TestBed.configureTestingModule({
      providers: [ApiInformationService, {provide: HttpClient, useValue: spy}],
    });
    httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>
    httpClientSpy.get.and.returnValue(new Observable());
    apiService = TestBed.inject(ApiInformationService);
    server = getTestServer();
  });

  describe('ApiInformationService.getMethods() tests', () => {
    it('create an instance', () => {
      expect(apiService).toBeTruthy();
    });

    it('Should return methods for /projects/{project_id}', fakeAsync(() => {
      let res: Methods[];
      const mockGetPath: IPathDict[] = [{
        methods: ['GET', 'DELETE', 'PUT'],
        originalPath: '/v3/projects/{project_id}',
        path: '/projects/{project_id}',
        subPaths: ['projects', '{project_id}'],
      }, {
        methods: ['GET', 'POST'],
        originalPath: '/v3/projects/{project_id}/nodes',
        path: '/projects/{project_id}/nodes',
        subPaths: ['projects', '{project_id}', 'nodes'],
      }];
      spyOn(apiService, 'getPath').and.returnValue(of(mockGetPath));
      apiService.getMethods('/projects/{project_id}').subscribe(data => {
        res = data;
      });
      tick();
      expect(res).toContain(Methods.GET)
      expect(res).toContain(Methods.PUT)
      expect(res).toContain(Methods.POST)
    }));

    it('Should return empty array if no data available', fakeAsync(() => {
      let res: Methods[];
      const mockGetPath: IPathDict[] = [];
      spyOn(apiService, 'getPath').and.returnValue(of(mockGetPath));
      apiService.getMethods('/projects/{project_id}').subscribe(data => {
        res = data;
      });
      tick();
      expect(res.length).toBe(0);
    }));


  })

  describe('ApiInformationService.getPath() tests', () => {

    it('Should return array of 2', fakeAsync(() => {

      let res: IPathDict[];
      const mockData: ReplaySubject<IPathDict[]> = new ReplaySubject<IPathDict[]>(1);
      const mockGetPath: IPathDict[] = [{
        methods: ['GET', 'DELETE', 'PUT'],
        originalPath: '/v3/projects/{project_id}',
        path: '/projects/{project_id}',
        subPaths: ['projects', '{project_id}'],
      }, {
        methods: ['GET', 'POST'],
        originalPath: '/v3/projects/{project_id}/nodes',
        path: '/projects/{project_id}/nodes',
        subPaths: ['projects', '{project_id}', 'nodes'],
      }];
      apiService['data'] = mockData;
      apiService['data'].next(mockGetPath);
      apiService.getPath('/projects/{project_id}').subscribe((data) => {
        res = data;
      });
      tick();
      expect(res.length).toBe(2);
      expect(res).toContain(mockGetPath[0]);
      expect(res).toContain(mockGetPath[1]);
    }));

    it('Should return empty array if ApiInformationService.data does not have info about nodes', fakeAsync(() => {

      let res: IPathDict[];
      const mockIPathDict: IPathDict[] = [{
        methods: ['GET', 'DELETE', 'PUT'],
        originalPath: '/v3/projects/{project_id}',
        path: '/projects/{project_id}',
        subPaths: ['projects', '{project_id}'],
      }, {
        methods: ['GET', 'POST'],
        originalPath: '/v3/projects/{project_id}/nodes',
        path: '/projects/{project_id}/nodes',
        subPaths: ['projects', '{project_id}', 'nodes'],
      }];
      const mockData: ReplaySubject<IPathDict[]> = new ReplaySubject<IPathDict[]>(1);
      apiService['data'] = mockData;
      apiService['data'].next(mockIPathDict);

      apiService.getPath('/nodes').subscribe( (data) => {
        res = data;
      });
      tick();
      expect(res.length).toBe(0);
    }));

    it('Should return array of 1 ', fakeAsync(() => {

      let res: IPathDict[];
      const mockData: ReplaySubject<IPathDict[]> = new ReplaySubject<IPathDict[]>(1);
      const mockGetPath: IPathDict[] = [{
        methods: ['GET', 'DELETE', 'PUT'],
        originalPath: '/v3/projects/{project_id}',
        path: '/projects/{project_id}',
        subPaths: ['projects', '{project_id}'],
      }, {
        methods: ['GET', 'POST'],
        originalPath: '/v3/projects/{project_id}/nodes',
        path: '/projects/{project_id}/nodes',
        subPaths: ['projects', '{project_id}', 'nodes'],
      }, {
        methods: ['GET', 'PUT', 'DELETE'],
        originalPath: '/v3/projects/{project_id}/nodes/{node_id}',
        path: '/projects/{project_id}/nodes/{node_id}',
        subPaths: ['projects', '{project_id}', 'nodes', '{node_id}'],
      }];
      apiService['data'] = mockData;
      apiService['data'].next(mockGetPath);
      apiService.getPath('/projects/tralala/nodes/bidule').subscribe((data) => {
        res = data;
      });
      tick();
      expect(res.length).toBe(1)
      expect(res).toContain(mockGetPath[2])
    }));


  });

  describe('ApiInformationService.getPathNextElement tests ',  () => {
    it('Should return next path elements possible', fakeAsync(() => {
      let res: string[];
      const mockGetPath: IPathDict[] = [{
        methods: ['GET', 'DELETE', 'PUT'],
        originalPath: '/v3/projects/{project_id}',
        path: '/projects/{project_id}',
        subPaths: ['projects', '{project_id}'],
      }, {
        methods: ['GET', 'POST'],
        originalPath: '/v3/projects/{project_id}/nodes',
        path: '/projects/{project_id}/nodes',
        subPaths: ['projects', '{project_id}', 'nodes'],
      }];
      spyOn(apiService, 'getPath').and.returnValue(of(mockGetPath));
      apiService.getPathNextElement(['projects','{project_id}']).subscribe(data => {
        res = data;
      });
      tick();
      expect(res.length).toBe(1);
      expect(res).toContain('nodes');
    }));

    it('Should return no next path elements for /projects/{project_id}/nodes', fakeAsync(() => {
      let res: string[];
      const mockGetPath: IPathDict[] = [{
        methods: ['GET', 'DELETE', 'PUT'],
        originalPath: '/v3/projects/{project_id}',
        path: '/projects/{project_id}',
        subPaths: ['projects', '{project_id}'],
      }, {
        methods: ['GET', 'POST'],
        originalPath: '/v3/projects/{project_id}/nodes',
        path: '/projects/{project_id}/nodes',
        subPaths: ['projects', '{project_id}', 'nodes'],
      }];
      spyOn(apiService, 'getPath').and.returnValue(of(mockGetPath));
      apiService.getPathNextElement(['projects', '{project_id}', 'nodes']).subscribe(data => {
        res = data;
      });
      tick();
      expect(res.length).toBe(0);
    }));

    it('Should return no next path elements for /templates', fakeAsync(() => {
      let res: string[];
      const mockGetPath: IPathDict[] = [];
      spyOn(apiService, 'getPath').and.returnValue(of(mockGetPath));
      apiService.getPathNextElement(['templates']).subscribe(data => {
        res = data;
      });
      tick();
      expect(res.length).toBe(0);
    }));

  });

  describe('ApiInformationService.getKeysForPath tests ', () => {
    it('Should return key/value pairs for path /projects/tralala/nodes/bidule', fakeAsync(() => {
      let res: { key: string; value: string }[];
      const mockGetPath: IPathDict[] = [{
        methods: ['GET', 'PUT', 'DELETE'],
        originalPath: '/v3/projects/{project_id}/nodes/{node_id}',
        path: '/projects/{project_id}/nodes/{node_id}',
        subPaths: ['projects', '{project_id}', 'nodes', '{node_id}'],
      }, {
        methods: ['GET'],
        originalPath: '/v3/projects/{project_id}/nodes/{node_id}/links',
        path: '/projects/{project_id}/nodes/{node_id}/links',
        subPaths: ['projects', '{project_id}', 'nodes', '{node_id}', 'links'],
      }];
      spyOn(apiService, 'getPath').and.returnValue(of(mockGetPath));
      apiService.getKeysForPath('/projects/tralala/nodes/bidule').subscribe(data => {
        res = data;
      });
      tick();
      expect(res.length).toBe(2);
      expect(res).toContain({key: '{project_id}', value: 'tralala'});
      expect(res).toContain({key: '{node_id}', value: 'bidule'});
    }));

    it('Should return no key/value pairs for path /projects', fakeAsync(() => {
      let res: { key: string; value: string }[];
      const mockGetPath: IPathDict[] = [{
        methods: ['GET', 'POST'],
        originalPath: '/v3/projects',
        path: '/projects',
        subPaths: ['projects'],
      }, {
        methods: ['GET', 'DELETE', 'PUT'],
        originalPath: '/v3/projects/{project_id}',
        path: '/projects/{project_id}',
        subPaths: ['projects', '{project_id}'],
      }];
      spyOn(apiService, 'getPath').and.returnValue(of(mockGetPath));
      apiService.getKeysForPath('/projects').subscribe(data => {
        res = data;
      });
      tick();
      expect(res.length).toBe(0);
    }));

    xit('Should return no key/value pairs for path /projects/tralala if no data available', fakeAsync(() => {
      let res: { key: string; value: string }[];
      const mockGetPath: IPathDict[] = [];
      spyOn(apiService, 'getPath').and.returnValue(of(mockGetPath));
      apiService.getKeysForPath('/projects').subscribe(data => {
        res = data;
      });
      tick();
      expect(res.length).toBe(0);
    }));

  });

  describe('ApiInformationService.getListByObjectId tests', () => {

    it('Should', fakeAsync(() => {
      let res: IGenericApiObject[];
      const mockGetCache: IGenericApiObject[] = [{id: 'id-tralala', name: 'tralala-project'}];
      spyOn(apiService['cache'], 'get').and.returnValue(mockGetCache);
      apiService.getListByObjectId(server, '{project_id}', 'id-tralala').subscribe(data => {
        res = data;
      });
      tick();
      expect(res.length).toBe(1);
      expect(res).toContain(mockGetCache[0])
    }));




  });

  describe('ApiInformationService.getIdByObjNameFromCache tests ', () => {
    it('Should get possible id of object whose name contains tralala', () => {
      const mockGetCache: IGenericApiObject[] = [{id: 'id-tralala', name: 'tralala-project'},
        {id: 'id-tralala2', name: 'other-tralala-project'}];
      spyOn(apiService['cache'], 'searchByName').and.returnValue(mockGetCache);
      const res = apiService.getIdByObjNameFromCache('tralala');
      expect(res.length).toBe(2);
      expect(res).toContain(mockGetCache[0]);
      expect(apiService['cache'].searchByName).toHaveBeenCalled();
    })

    it('Should get empty array for object whose name contains tralala', () => {
      const mockGetCache: IGenericApiObject[] = [];
      spyOn(apiService['cache'], 'searchByName').and.returnValue(mockGetCache);
      const res = apiService.getIdByObjNameFromCache('tralala');
      expect(res.length).toBe(0);
      expect(apiService['cache'].searchByName).toHaveBeenCalled();
    })
  });

});
