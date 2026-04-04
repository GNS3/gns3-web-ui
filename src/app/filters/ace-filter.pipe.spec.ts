import { describe, it, expect, beforeEach } from 'vitest';
import { AceFilterPipe } from './ace-filter.pipe';
import { MatTableDataSource } from '@angular/material/table';
import { ACE, AceType } from '@models/api/ACE';
import { Endpoint, RessourceType } from '@models/api/endpoint';

describe('AceFilterPipe', () => {
  let pipe: AceFilterPipe;

  const createMockEndpoint = (overrides: Partial<Endpoint> = {}): Endpoint => {
    return {
      endpoint: '/api/users/1',
      name: 'User One',
      endpoint_type: RessourceType.user,
      ...overrides,
    };
  };

  const createMockACE = (overrides: Partial<ACE> = {}): ACE => {
    return {
      ace_id: 'ace-1',
      ace_type: AceType.user,
      path: '/api/projects/1',
      propagate: true,
      allowed: true,
      role_id: 'role-1',
      user_id: 'user-1',
      group_id: 'group-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  };

  const endpoints: Endpoint[] = [
    createMockEndpoint({ endpoint: '/api/users/user-1', name: 'User One', endpoint_type: RessourceType.user }),
    createMockEndpoint({ endpoint: '/api/users/user-2', name: 'User Two', endpoint_type: RessourceType.user }),
    createMockEndpoint({ endpoint: '/api/groups/group-1', name: 'Group One', endpoint_type: RessourceType.group }),
    createMockEndpoint({ endpoint: '/api/groups/group-2', name: 'Group Two', endpoint_type: RessourceType.group }),
    createMockEndpoint({ endpoint: '/api/projects/1', name: 'Project One', endpoint_type: RessourceType.project }),
    createMockEndpoint({ endpoint: '/api/projects/2', name: 'Project Two', endpoint_type: RessourceType.project }),
    createMockEndpoint({ endpoint: '/api/roles/role-1', name: 'Role One', endpoint_type: RessourceType.project }),
    createMockEndpoint({ endpoint: '/api/roles/role-2', name: 'Role Two', endpoint_type: RessourceType.project }),
  ];

  beforeEach(() => {
    pipe = new AceFilterPipe();
  });

  describe('transform', () => {
    it('should return empty array when items is null', () => {
      const result = pipe.transform(null as any, 'search', endpoints);
      expect(result).toEqual([]);
    });

    it('should return empty array when items is undefined', () => {
      const result = pipe.transform(undefined as any, 'search', endpoints);
      expect(result).toEqual([]);
    });

    it('should return items MatTableDataSource when searchText is empty', () => {
      const aces = [createMockACE(), createMockACE({ ace_id: 'ace-2' })];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, '', endpoints);

      expect(result).toBe(dataSource);
    });

    it('should return items MatTableDataSource when searchText is null', () => {
      const aces = [createMockACE()];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, null as any, endpoints);

      expect(result).toBe(dataSource);
    });

    it('should filter ACEs by user name (case-insensitive)', () => {
      const aces = [
        createMockACE({ ace_id: 'ace-1', user_id: 'user-1' }),
        createMockACE({ ace_id: 'ace-2', user_id: 'user-2' }),
      ];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'User One', endpoints) as ACE[];

      expect(result.length).toBe(1);
      expect(result[0].ace_id).toBe('ace-1');
    });

    it('should filter ACEs by group name', () => {
      const aces = [
        createMockACE({ ace_id: 'ace-1', group_id: 'group-1' }),
        createMockACE({ ace_id: 'ace-2', group_id: 'group-2' }),
      ];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'Group One', endpoints) as ACE[];

      expect(result.length).toBe(1);
      expect(result[0].ace_id).toBe('ace-1');
    });

    it('should filter ACEs by project/path name', () => {
      const aces = [
        createMockACE({ ace_id: 'ace-1', path: '/api/projects/1' }),
        createMockACE({ ace_id: 'ace-2', path: '/api/projects/2' }),
      ];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'Project One', endpoints) as ACE[];

      expect(result.length).toBe(1);
      expect(result[0].ace_id).toBe('ace-1');
    });

    it('should filter ACEs by role name', () => {
      const aces = [
        createMockACE({ ace_id: 'ace-1', role_id: 'role-1' }),
        createMockACE({ ace_id: 'ace-2', role_id: 'role-2' }),
      ];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'Role One', endpoints) as ACE[];

      expect(result.length).toBe(1);
      expect(result[0].ace_id).toBe('ace-1');
    });

    it('should return multiple matches when search matches multiple ACEs', () => {
      const aces = [
        createMockACE({ ace_id: 'ace-1', user_id: 'user-1' }),
        createMockACE({ ace_id: 'ace-2', user_id: 'user-2' }),
        createMockACE({ ace_id: 'ace-3', user_id: 'user-1' }),
      ];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'User', endpoints) as ACE[];

      expect(result.length).toBe(3);
    });

    it('should return empty array when no endpoint name matches search', () => {
      const aces = [
        createMockACE({ ace_id: 'ace-1', user_id: 'user-1' }),
        createMockACE({ ace_id: 'ace-2', user_id: 'user-2' }),
      ];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'NonExistent', endpoints);

      expect(result).toEqual([]);
    });

    it('should handle case-insensitive search', () => {
      const aces = [
        createMockACE({ ace_id: 'ace-1', user_id: 'user-1' }),
      ];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'user one', endpoints) as ACE[];

      expect(result.length).toBe(1);
      expect(result[0].ace_id).toBe('ace-1');
    });

    it('should return empty array when endpoints array is empty', () => {
      const aces = [createMockACE()];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'User One', []);

      expect(result).toEqual([]);
    });

    it('should return empty array when dataSource has no ACEs', () => {
      const dataSource = new MatTableDataSource<ACE>([]);

      const result = pipe.transform(dataSource, 'search', endpoints);

      expect(result).toEqual([]);
    });

    it('should filter by partial match in endpoint name', () => {
      const aces = [
        createMockACE({ ace_id: 'ace-1', user_id: 'user-1' }),
        createMockACE({ ace_id: 'ace-2', user_id: 'user-2' }),
      ];
      const dataSource = new MatTableDataSource<ACE>(aces);

      const result = pipe.transform(dataSource, 'Two', endpoints) as ACE[];

      expect(result.length).toBe(1);
      expect(result[0].ace_id).toBe('ace-2');
    });
  });
});
