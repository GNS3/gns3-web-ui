import {PermissionsFilterPipe} from './permissions-filter.pipe';
import {Methods, Permission, PermissionActions} from "../../models/api/permission";

const testPermissions: Permission[] = [
  {
    methods: [Methods.GET, Methods.PUT],
    path: '/projects/projet-test',
    action: PermissionActions.ALLOW,
    description: 'description of permission 1',
    created_at: "2022-03-15T09:45:36.531Z",
    updated_at: "2022-03-15T09:45:36.531Z",
    permission_id: '1'
  },
  {
    methods: [Methods.GET, Methods.PUT],
    path: '/projects/projet-test/nodes',
    action: PermissionActions.ALLOW,
    description: 'permission on projet-test nodes',
    created_at: "2022-03-15T09:45:36.531Z",
    updated_at: "2022-03-15T09:45:36.531Z",
    permission_id: '2'
  },
  {
    methods: [Methods.GET, Methods.PUT],
    path: '/projects/projet-bidule',
    action: PermissionActions.ALLOW,
    description: 'permission on biduler project',
    created_at: "2022-03-15T09:45:36.531Z",
    updated_at: "2022-03-15T09:45:36.531Z",
    permission_id: '3'
  }
]

describe('PermissionsFilterPipe', () => {
  const pipe = new PermissionsFilterPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('Should return all test permissions', () => {
    const res = pipe.transform(testPermissions, '');
    expect(res.length).toBe(3);
  });

  it('Should return both permissions concerning project projet-test', () => {
    const res = pipe.transform(testPermissions, 'test');
    expect(res.length).toBe(2);
    expect(res).toContain(testPermissions[0]);
    expect(res).toContain(testPermissions[1]);
  });

  it('Should return no permissions', () => {
    const res = pipe.transform(testPermissions, 'aaaaaa');
    expect(res.length).toBe(0);
  });
});
