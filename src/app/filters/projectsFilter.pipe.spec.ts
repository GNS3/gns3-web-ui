import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectsFilter } from './projectsFilter.pipe';
import { Project } from '@models/project';

describe('ProjectsFilter', () => {
  let pipe: ProjectsFilter;

  const mockProject = (name: string, created_by: string): Project =>
    ({
      auto_close: false,
      auto_open: false,
      auto_start: false,
      drawing_grid_size: 25,
      filename: `${name}.gns3`,
      grid_size: 25,
      name,
      path: '/path/to/project',
      project_id: 'test-id',
      scene_height: 1000,
      scene_width: 1000,
      status: 'opened',
      created_by,
      readonly: false,
      show_interface_labels: false,
      show_layers: false,
      show_grid: true,
      snap_to_grid: true,
      variables: [],
    } as Project);

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
        mockProject('Project 1', 'user1'),
        mockProject('Project 2', 'user2'),
      ]);
      const result = pipe.transform(mockDataSource, null as any);
      expect(result).toBe(mockDataSource);
    });

    it('should return items when searchText is undefined', () => {
      const mockDataSource = createMockProjectDataSource([
        mockProject('Project 1', 'user1'),
        mockProject('Project 2', 'user2'),
      ]);
      const result = pipe.transform(mockDataSource, undefined as any);
      expect(result).toBe(mockDataSource);
    });

    it('should return items when searchText is empty string', () => {
      const mockDataSource = createMockProjectDataSource([
        mockProject('Project 1', 'user1'),
        mockProject('Project 2', 'user2'),
      ]);
      const result = pipe.transform(mockDataSource, '');
      expect(result).toBe(mockDataSource);
    });

    it('should filter projects by name case-insensitively', () => {
      const projects = [
        mockProject('MyNetworkLab', 'john'),
        mockProject('AnotherProject', 'jane'),
        mockProject('mynetworklab_backup', 'bob'),
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'mynetworklab');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('MyNetworkLab');
      expect(result[1].name).toBe('mynetworklab_backup');
    });

    it('should filter projects by created_by field', () => {
      const projects = [
        mockProject('Project 1', 'john.doe'),
        mockProject('Project 2', 'jane.smith'),
        mockProject('Project 3', 'bob.wilson'),
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'john');

      expect(result).toHaveLength(1);
      expect(result[0].created_by).toBe('john.doe');
    });

    it('should filter projects by both name and created_by with OR logic', () => {
      const projects = [
        mockProject('Network Lab', 'john'),
        mockProject('Web Server', 'jane'),
        mockProject('Database', 'john'),
        mockProject('john Project', 'bob'),
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'john');

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Network Lab');
      expect(result[1].created_by).toBe('john');
      expect(result[2].name).toBe('john Project');
    });

    it('should return empty array when no projects match', () => {
      const projects = [mockProject('Project 1', 'user1'), mockProject('Project 2', 'user2')];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should filter projects with partial name match', () => {
      const projects = [
        mockProject('test_network_lab', 'user1'),
        mockProject('production_env', 'user2'),
        mockProject('my_test_server', 'user3'),
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'test');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test_network_lab');
      expect(result[1].name).toBe('my_test_server');
    });

    it('should handle projects with null or undefined created_by', () => {
      const projects = [
        mockProject('Project 1', 'john'),
        mockProject('Project 2', ''),
        mockProject('Project 3', null as any),
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'project');

      expect(result).toHaveLength(3);
    });

    it('should handle projects with null or undefined name', () => {
      const projects = [
        mockProject('Network Lab', 'john'),
        { ...mockProject('', 'jane'), name: null as any },
        { ...mockProject('', 'bob'), name: undefined as any },
      ];
      const mockDataSource = createMockProjectDataSource(projects);

      const result = pipe.transform(mockDataSource, 'john');

      expect(result).toHaveLength(1);
      expect(result[0].created_by).toBe('john');
    });
  });
});
