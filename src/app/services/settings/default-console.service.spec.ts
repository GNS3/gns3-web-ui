import { DefaultConsoleService } from './default-console.service';

describe('DefaultConsoleService', () => {
  let service: DefaultConsoleService;

  beforeEach(() => {
    service = new DefaultConsoleService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return undefined (web application cannot detect local terminals)', () => {
    expect(service.get()).toBeUndefined();
  });
});
