// Test file to check if setup file is loaded
console.log('Test file loaded, globalThis.xdescribe =', (globalThis as any).xdescribe);

describe('Setup Check', () => {
  it('should have xdescribe defined', () => {
    console.log('In test, globalThis.xdescribe =', (globalThis as any).xdescribe);
    expect((globalThis as any).xdescribe).toBeDefined();
  });
});
