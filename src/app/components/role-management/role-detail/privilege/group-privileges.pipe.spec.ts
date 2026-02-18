import { GroupPrivilegesPipe } from './group-privileges.pipe';

describe('GroupPrivilegesPipe', () => {
  it('create an instance', () => {
    const pipe = new GroupPrivilegesPipe();
    expect(pipe).toBeTruthy();
  });
});
