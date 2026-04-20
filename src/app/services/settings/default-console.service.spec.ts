import { describe, it, expect } from 'vitest';
import { DefaultConsoleService } from './default-console.service';

describe('DefaultConsoleService', () => {
  let service: DefaultConsoleService;

  it('should be created', () => {
    service = new DefaultConsoleService();
    expect(service).toBeTruthy();
  });

  it('should return undefined for get()', () => {
    service = new DefaultConsoleService();
    expect(service.get()).toBeUndefined();
  });
});
