import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectNameValidator } from './projectNameValidator';

describe('ProjectNameValidator', () => {
  let validator: ProjectNameValidator;

  beforeEach(() => {
    validator = new ProjectNameValidator();
  });

  describe('get', () => {
    it('should return null for valid project name', () => {
      const result = validator.get({ value: 'My Project' });
      expect(result).toBeNull();
    });

    it('should return null for alphanumeric name', () => {
      const result = validator.get({ value: 'Project123' });
      expect(result).toBeNull();
    });

    it('should return null for name with spaces and hyphens', () => {
      const result = validator.get({ value: 'My-Network-Project' });
      expect(result).toBeNull();
    });

    it('should return null for name with underscores', () => {
      const result = validator.get({ value: 'my_network_project' });
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = validator.get({ value: '' });
      expect(result).toBeNull();
    });

    it('should return null for name with dots', () => {
      const result = validator.get({ value: 'project.backup' });
      expect(result).toBeNull();
    });

    it('should return { invalidName: true } for name with tilde', () => {
      const result = validator.get({ value: 'my~project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with backtick', () => {
      const result = validator.get({ value: 'my`project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with exclamation mark', () => {
      const result = validator.get({ value: 'my!project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with hash', () => {
      const result = validator.get({ value: 'my#project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with dollar sign', () => {
      const result = validator.get({ value: 'my$project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with percent', () => {
      const result = validator.get({ value: 'my%project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with caret', () => {
      const result = validator.get({ value: 'my^project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with ampersand', () => {
      const result = validator.get({ value: 'my&project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with asterisk', () => {
      const result = validator.get({ value: 'my*project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with plus', () => {
      const result = validator.get({ value: 'my+project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with brackets', () => {
      const result = validator.get({ value: 'my[project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with backslash', () => {
      const result = validator.get({ value: 'my\\project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with semicolon', () => {
      const result = validator.get({ value: 'my;project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with single quote', () => {
      const result = validator.get({ value: "my'project" });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with comma', () => {
      const result = validator.get({ value: 'my,project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with forward slash', () => {
      const result = validator.get({ value: 'my/project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with curly braces', () => {
      const result = validator.get({ value: 'my{project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with pipe', () => {
      const result = validator.get({ value: 'my|project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with double quotes', () => {
      const result = validator.get({ value: 'my"project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with angle brackets', () => {
      const result = validator.get({ value: 'my<project' });
      expect(result).toEqual({ invalidName: true });
    });

    it('should return { invalidName: true } for name with question mark', () => {
      const result = validator.get({ value: 'my?project' });
      expect(result).toEqual({ invalidName: true });
    });
  });
});
