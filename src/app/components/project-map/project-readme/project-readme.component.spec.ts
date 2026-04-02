import { describe, it, expect } from 'vitest';
import { ProjectReadmeComponent } from './project-readme.component';

describe('ProjectReadmeComponent', () => {
  describe('prototype methods', () => {
    it('should have ngAfterViewInit method', () => {
      expect(typeof (ProjectReadmeComponent.prototype as any).ngAfterViewInit).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (ProjectReadmeComponent.prototype as any).onNoClick).toBe('function');
    });
  });
});
