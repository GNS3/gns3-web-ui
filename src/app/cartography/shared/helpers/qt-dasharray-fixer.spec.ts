import { QtDasharrayFixer } from "./qt-dasharray-fixer";


describe('QtDashArrayFixer', () => {
  let fixer: QtDasharrayFixer;

  beforeEach(() => {
    fixer = new QtDasharrayFixer();
  });

  it('should fix when matches mapping', () => {
    expect(fixer.fix('25, 25')).toEqual('');
  });

  it('should not fix when do not match mapping', () => {
    expect(fixer.fix('1, 2, 3')).toEqual('1, 2, 3');
  });
});
