/* tslint:disable:no-shadowed-variable */
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {AddPermissionLineComponent} from "@components/permissions-management/add-permission-line/add-permission-line.component";
import {ApiInformationService} from "@services/ApiInformation/api-information.service";
import {PermissionsService} from "@services/permissions.service";
import {ToasterService} from "@services/toaster.service";
import {Methods, Permission, PermissionActions} from "@models/api/permission";
import {Server} from "@models/server";
import {Observable, of, throwError} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";

class MockApiInformationService {

}

class MockPermissionService {
}

class MockToasterService {

}


describe('AddPermissionLineComponent', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        AddPermissionLineComponent,
        {provide: ApiInformationService, useClass: MockApiInformationService},
        {provide: PermissionsService, useClass: MockPermissionService},
        {provide: ToasterService, useClass: MockToasterService}
      ]
    });
  });

  it('Should add GET method to method list', () => {
    const comp = TestBed.inject(AddPermissionLineComponent);
    comp.updateMethod({name: Methods.GET, enable: true});
    expect(comp.permission.methods).toContain(Methods.GET);
  });

  it('Should remove GET Method from list', () => {
    const comp = TestBed.inject(AddPermissionLineComponent);
    comp.permission.methods = [Methods.GET, Methods.PUT, Methods.POST, Methods.DELETE];
    comp.updateMethod({name: Methods.GET, enable: false});

    expect(comp.permission.methods).not.toContain(Methods.GET);
  });

  it('Should not add same GET method a second time', () => {
    const comp = TestBed.inject(AddPermissionLineComponent);
    comp.permission.methods = [Methods.GET, Methods.PUT, Methods.POST, Methods.DELETE];
    comp.updateMethod({name: Methods.GET, enable: true});

    expect(comp.permission.methods).toEqual([Methods.GET, Methods.PUT, Methods.POST, Methods.DELETE]);
  });

  it('Should reset permission values', () => {
    const comp = TestBed.inject(AddPermissionLineComponent);
    comp.permission.methods = [Methods.GET, Methods.PUT, Methods.POST, Methods.DELETE];
    comp.permission.path = "/test/path";
    comp.permission.action = PermissionActions.DENY;
    comp.permission.description = "john doe is here";

    comp.reset();
    const p = comp.permission;

    expect(p.methods).toEqual([]);
    expect(p.action).toEqual(PermissionActions.ALLOW);
    expect(p.description).toEqual('');
  });

  it('Should save permission with success', fakeAsync(() => {
    const comp = TestBed.inject(AddPermissionLineComponent);
    const permissionService = TestBed.inject(PermissionsService);
    const toasterService = TestBed.inject(ToasterService);
    comp.permission.methods = [Methods.GET, Methods.PUT, Methods.POST, Methods.DELETE];
    comp.permission.path = "/test/path";
    comp.permission.action = PermissionActions.DENY;
    comp.permission.description = "john doe is here";

    permissionService.add = (server: Server, permission: Permission): Observable<Permission> => {
      return of(permission);
    };

    let message: string;

    toasterService.success = (m: string) => {
      message = m;
    };

    comp.save();
    const p = comp.permission;

    tick();
    expect(message).toBeTruthy();
    expect(p.methods).toEqual([]);
    expect(p.action).toEqual(PermissionActions.ALLOW);
    expect(p.description).toEqual('');

  }));

  it('Should throw error on rejected permission', fakeAsync(() => {
    const comp = TestBed.inject(AddPermissionLineComponent);
    const permissionService = TestBed.inject(PermissionsService);
    const toasterService = TestBed.inject(ToasterService);
    comp.permission.methods = [Methods.GET, Methods.PUT, Methods.POST, Methods.DELETE];
    comp.permission.path = "/test/path";
    comp.permission.action = PermissionActions.DENY;
    comp.permission.description = "john doe is here";

    let errorMessage: string;

    permissionService.add = (server: Server, permission: Permission): Observable<Permission> => {
      const error = new HttpErrorResponse({
        error: new Error("An error occur"),
        headers: undefined,
        status: 500,
        statusText: 'error from server'
      });
      return throwError(error);
    };

    toasterService.error = (message: string) => {
      errorMessage = message;
    };

    comp.save();
    tick();
    expect(errorMessage).toBeTruthy();
  }));
});
