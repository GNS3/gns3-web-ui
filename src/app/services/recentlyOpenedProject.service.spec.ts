import { describe, it, expect, beforeEach } from 'vitest';
import { RecentlyOpenedProjectService } from './recentlyOpenedProject.service';

describe('RecentlyOpenedProjectService', () => {
  let service: RecentlyOpenedProjectService;

  beforeEach(() => {
    service = new RecentlyOpenedProjectService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of RecentlyOpenedProjectService', () => {
      expect(service).toBeInstanceOf(RecentlyOpenedProjectService);
    });
  });

  describe('setcontrollerId', () => {
    it('should store controller ID', () => {
      service.setcontrollerId('controller-1');

      expect(service.getcontrollerId()).toBe('controller-1');
    });
  });

  describe('setProjectId', () => {
    it('should store project ID', () => {
      service.setProjectId('project-1');

      expect(service.getProjectId()).toBe('project-1');
    });
  });

  describe('setcontrollerIdProjectList', () => {
    it('should store controller ID for project list', () => {
      service.setcontrollerIdProjectList('controller-2');

      expect(service.getcontrollerIdProjectList()).toBe('controller-2');
    });
  });

  describe('getters', () => {
    it.each([
      ['getcontrollerId', 'setcontrollerId', 'controller-1'],
      ['getProjectId', 'setProjectId', 'project-1'],
      ['getcontrollerIdProjectList', 'setcontrollerIdProjectList', 'controller-2'],
    ])('should return undefined when not set and value when set', (getter, setter, value) => {
      expect(service[getter]()).toBeUndefined();
      service[setter](value);
      expect(service[getter]()).toBe(value);
    });
  });

  describe('removeData', () => {
    it('should clear controllerId and projectId', () => {
      service.setcontrollerId('controller-1');
      service.setProjectId('project-1');

      service.removeData();

      expect(service.getcontrollerId()).toBe('');
      expect(service.getProjectId()).toBe('');
    });

    it('should not clear controllerIdProjectList', () => {
      service.setcontrollerIdProjectList('controller-2');

      service.removeData();

      expect(service.getcontrollerIdProjectList()).toBe('controller-2');
    });

    it('should not throw when called without prior setting', () => {
      expect(() => service.removeData()).not.toThrow();
    });
  });
});
