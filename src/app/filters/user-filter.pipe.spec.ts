import { describe, it, expect, beforeEach } from 'vitest';
import { UserFilterPipe } from './user-filter.pipe';
import { MatTableDataSource } from '@angular/material/table';
import { User } from '@models/users/user';

describe('UserFilterPipe', () => {
  let pipe: UserFilterPipe;

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    created_at: '2024-01-01T00:00:00Z',
    email: 'user@example.com',
    full_name: 'Test User',
    last_login: '2024-01-01T00:00:00Z',
    is_active: true,
    is_superadmin: false,
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
    username: 'testuser',
    ...overrides,
  });

  beforeEach(() => {
    pipe = new UserFilterPipe();
  });

  describe('transform', () => {
    it('should return empty array when items is null', () => {
      const result = pipe.transform(null as any, 'search');
      expect(result).toEqual([]);
    });

    it('should return empty array when items is undefined', () => {
      const result = pipe.transform(undefined as any, 'search');
      expect(result).toEqual([]);
    });

    it('should return items unchanged when searchText is empty', () => {
      const users = [createMockUser(), createMockUser({ username: 'user2' })];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, '');

      // When searchText is empty, the pipe returns the MatTableDataSource itself
      expect(result).toEqual(dataSource);
    });

    it('should return items unchanged when searchText is null', () => {
      const users = [createMockUser()];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, null as any);

      // When searchText is empty, the pipe returns the MatTableDataSource itself
      expect(result).toEqual(dataSource);
    });

    it('should filter by username (case-insensitive)', () => {
      const users = [
        createMockUser({ username: 'john' }),
        createMockUser({ username: 'jane' }),
        createMockUser({ username: 'alice' }),
      ];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, 'john') as User[];

      expect(result.length).toBe(1);
      expect(result[0].username).toBe('john');
    });

    it('should filter by full_name (case-insensitive)', () => {
      const users = [
        createMockUser({ username: 'user1', full_name: 'John Doe' }),
        createMockUser({ username: 'user2', full_name: 'Jane Smith' }),
        createMockUser({ username: 'user3', full_name: 'Alice Johnson' }),
      ];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, 'jane') as User[];

      expect(result.length).toBe(1);
      expect(result[0].full_name).toBe('Jane Smith');
    });

    it('should filter by email (case-insensitive)', () => {
      const users = [
        createMockUser({ email: 'john@company.com' }),
        createMockUser({ email: 'jane@company.com' }),
        createMockUser({ email: 'alice@company.com' }),
      ];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, 'ALICE@') as User[];

      expect(result.length).toBe(1);
      expect(result[0].email).toBe('alice@company.com');
    });

    it('should match partial text in any field', () => {
      const users = [
        createMockUser({ username: 'testuser', email: 'user@domain.com', full_name: 'Test User' }),
      ];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, 'domain') as User[];

      expect(result.length).toBe(1);
      expect(result[0].email).toBe('user@domain.com');
    });

    it('should return multiple matches when search matches multiple users', () => {
      const users = [
        createMockUser({ username: 'john_doe' }),
        createMockUser({ username: 'john_smith' }),
        createMockUser({ username: 'jane_doe' }),
      ];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, 'john') as User[];

      expect(result.length).toBe(2);
      expect(result.map((u) => u.username)).toContain('john_doe');
      expect(result.map((u) => u.username)).toContain('john_smith');
    });

    it('should return empty array when no match found', () => {
      const users = [
        createMockUser({ username: 'alice' }),
        createMockUser({ username: 'bob' }),
      ];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, 'xyz');

      expect(result).toEqual([]);
    });

    it('should handle case-insensitive search', () => {
      const users = [
        createMockUser({ username: 'TESTUSER' }),
      ];
      const dataSource = new MatTableDataSource<User>(users);

      const result = pipe.transform(dataSource, 'testuser') as User[];

      expect(result.length).toBe(1);
      expect(result[0].username).toBe('TESTUSER');
    });

    it('should handle user with missing optional fields', () => {
      const user: User = {
        created_at: '2024-01-01',
        email: '',
        full_name: '',
        last_login: '2024-01-01',
        is_active: true,
        is_superadmin: false,
        updated_at: '2024-01-01',
        user_id: 'user-1',
        username: 'testuser',
      };
      const dataSource = new MatTableDataSource<User>([user]);

      const result = pipe.transform(dataSource, 'testuser') as User[];

      expect(result.length).toBe(1);
    });

    it('should return empty array when dataSource has no users', () => {
      const dataSource = new MatTableDataSource<User>([]);

      const result = pipe.transform(dataSource, 'search');

      expect(result).toEqual([]);
    });
  });
});
