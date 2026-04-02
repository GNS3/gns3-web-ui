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

  describe('getcontrollerId', () => {
    it('should return undefined when not set', () => {
      expect(service.getcontrollerId()).toBeUndefined();
    });

    it('should return stored controller ID', () => {
      service.setcontrollerId('controller-1');

      expect(service.getcontrollerId()).toBe('controller-1');
    });
  });

  describe('getProjectId', () => {
    it('should return undefined when not set', () => {
      expect(service.getProjectId()).toBeUndefined();
    });

    it('should return stored project ID', () => {
      service.setProjectId('project-1');

      expect(service.getProjectId()).toBe('project-1');
    });
  });

  describe('getcontrollerIdProjectList', () => {
    it('should return undefined when not set', () => {
      expect(service.getcontrollerIdProjectList()).toBeUndefined();
    });

    it('should return stored controller ID for project list', () => {
      service.setcontrollerIdProjectList('controller-2');

      expect(service.getcontrollerIdProjectList()).toBe('controller-2');
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
  });
});
