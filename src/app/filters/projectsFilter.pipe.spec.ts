import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectsFilter } from './projectsFilter.pipe';
import { Project } from '@models/project';

describe('ProjectsFilter', () => {
  let pipe: ProjectsFilter;

  const mockProject = (filename: string): Project =>
    ({
      auto_close: false,
      auto_open: false,
      auto_start: false,
      drawing_grid_size: 25,
      filename,
      grid_size: 25,
      name: 'Test Project',
      path: '/path/to/project',
      project_id: 'test-id',
      scene_height: 1000,
      scene_width: 1000,
      status: 'opened',
      readonly: false,
      show_interface_labels: false,
      show_layers: false,
      show_grid: true,
      snap_to_grid: true,
      variables: [],
    }) as Project;

  const createMockProjectDataSource = (projects: Project[]) => {
    const mockDatabase = {
      data: projects,
    };
    return { projectDatabase: mockDatabase } as any;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pipe = new ProjectsFilter();
  });

  describe('transform', () => {
    it('should return empty array when items is null', () => {
      const result = pipe.transform(null as any, 'test');
      expect(result).toEqual([]);
    });

    it('should return empty array when items is undefined', () => {
      const result = pipe.transform(undefined as any, 'test');
      expect(result).toEqual([]);
    });

    it('should return items when searchText is null', () => {
      const mockDataSource = createMockProjectDataSource([
        mockProject('project1.gns3'),
        mockProject('project2.gns3'),
      ]);
      const result = pipe.transform(mockDataSource, null as any);
      expect(result).toBe(mockDataSource);
    });

    it('should return items when searchText is undefined', () => {
      const mockDataSource = createMockProjectDataSource([
        mockProject('project1.gns3'),
        mockProject('project2.gns3'),
      ]);
      const result = pipe.transform(mockDataSource, undefined as any);
      expect(result).toBe(mockDataSource);
    });

    it('should return items when searchText is empty string', () => {
      const mockDataSource = createMockProjectDataSource([
        mockProject('project1.gns3'),
        mockProject('project2.gns3'),
      ]);
      const result = pipe.transform(mockDataSource, '');
      expect(result).toBe(mockDataSource);
    });

    it('should filter projects by filename case-insensitively', () => {
      const projects = [
        mockProject('MyProject.gns3'),
        mockProject('another.gns3'),
        mockProject('myproject_backup.gns3'),
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'myproject');

      expect(result).toHaveLength(2);
      expect(result[0].filename).toBe('MyProject.gns3');
      expect(result[1].filename).toBe('myproject_backup.gns3');
    });

    it('should return empty array when no projects match', () => {
      const projects = [
        mockProject('project1.gns3'),
        mockProject('project2.gns3'),
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should filter projects with partial filename match', () => {
      const projects = [
        mockProject('test_project.gns3'),
        mockProject('other.gns3'),
        mockProject('my_test_file.gns3'),
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'test');

      expect(result).toHaveLength(2);
      expect(result[0].filename).toBe('test_project.gns3');
      expect(result[1].filename).toBe('my_test_file.gns3');
    });
  });
});
