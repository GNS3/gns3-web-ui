import {PermissionPath} from "@components/permissions-management/add-permission-line/path-auto-complete/PermissionPath";
import {SubPath} from "@components/permissions-management/add-permission-line/path-auto-complete/SubPath";

describe('PermissionPath', () => {

  it('Should add subPath to path', () => {
    const path = new PermissionPath();
    path.add(new SubPath('projects', 'projects', undefined));
    path.add(new SubPath('1111-2222-3333-4444', 'my project', 'project_id'));

    expect(path.getPath()).toEqual(['projects', '1111-2222-3333-4444']);
  });

  it('Should return display path', () => {
    const path = new PermissionPath();
    path.add(new SubPath('projects', 'projects', undefined));
    path.add(new SubPath('1111-2222-3333-4444', 'my project', 'project_id'));

    expect(path.getDisplayPath()).toEqual(['projects', 'my project']);
  });

  it('Should remove last element', () => {
    const path = new PermissionPath();
    path.add(new SubPath('projects', 'projects', undefined));
    path.add(new SubPath('1111-2222-3333-4444', 'my project', 'project_id'));
    path.add(new SubPath('nodes', 'nodes'));
    path.add(new SubPath('6666-7777-8888-9999', 'myFirstNode', 'node_id'));

    path.removeLast();
    expect(path.getPath()).toEqual(['projects', '1111-2222-3333-4444', 'nodes']);
  });

  it('Should return path variables', () => {
    const path = new PermissionPath();
    path.add(new SubPath('projects', 'projects', undefined));
    path.add(new SubPath('1111-2222-3333-4444', 'my project', 'project_id'));
    path.add(new SubPath('nodes', 'nodes'));
    path.add(new SubPath('6666-7777-8888-9999', 'myFirstNode', 'node_id'));

    expect(path.getVariables())
      .toEqual([{key: 'project_id', value: '1111-2222-3333-4444'}, { key: 'node_id', value: '6666-7777-8888-9999'}]);
  });


  it('Should return true if subPath contain *', () => {
    const path = new PermissionPath();
    path.add(new SubPath('projects', 'projects', undefined));
    path.add(new SubPath('1111-2222-3333-4444', 'my project', 'project_id'));
    path.add(new SubPath('nodes', 'nodes'));
    path.add(new SubPath('*', 'myFirstNode', 'node_id'));

    expect(path.containStar()).toBeTruthy();
  });

  it('Should return false if subPath does not contain *', () => {
    const path = new PermissionPath();
    path.add(new SubPath('projects', 'projects', undefined));
    path.add(new SubPath('1111-2222-3333-4444', 'my project', 'project_id'));
    path.add(new SubPath('nodes', 'nodes'));
    path.add(new SubPath('6666-7777-8888-999', 'myFirstNode', 'node_id'));

    expect(path.containStar()).toBeFalsy();
  });


  it('Should return true if path is empty', () => {
    const path = new PermissionPath();
    expect(path.isEmpty()).toBeTruthy();
  });


  it('Should return false if path is not empty', () => {
    const path = new PermissionPath();
    path.add(new SubPath('projects', 'projects', undefined));
    path.add(new SubPath('1111-2222-3333-4444', 'my project', 'project_id'));
    path.add(new SubPath('nodes', 'nodes'));
    path.add(new SubPath('6666-7777-8888-999', 'myFirstNode', 'node_id'));

    expect(path.isEmpty()).toBeFalsy();
  });

});
