import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupFilterPipe } from './group-filter.pipe';
import { MatTableDataSource } from '@angular/material/table';
import { Group } from '@models/groups/group';

/**
 * Helper function to create mock Group
 */
function createMockGroup(partial?: Partial<Group>): Group {
  return {
    name: 'Test Group',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_group_id: 'group-1',
    is_builtin: false,
    ...partial,
  };
}

/**
 * Helper function to create mock MatTableDataSource
 */
function createMockDataSource(groups?: Group[]): MatTableDataSource<Group> {
  const dataSource = new MatTableDataSource<Group>();
  dataSource.data = groups || [];
  return dataSource;
}

describe('GroupFilterPipe', () => {
  let pipe: GroupFilterPipe;

  beforeEach(() => {
    vi.clearAllMocks();
    pipe = new GroupFilterPipe();
  });

  describe('pipe creation', () => {
    it('should create the pipe', () => {
      expect(pipe).toBeTruthy();
    });

    it('should be instance of GroupFilterPipe', () => {
      expect(pipe).toBeInstanceOf(GroupFilterPipe);
    });

    it('should have transform method', () => {
      expect(typeof pipe.transform).toBe('function');
    });
  });

  describe('transform', () => {
    describe('when searchText is empty or falsy', () => {
      it.each([
        ['', 'empty string'],
        [null, 'null'],
        [undefined, 'undefined'],
      ])('should return groups unchanged when searchText is %s', (searchText: string | null | undefined) => {
        // Arrange
        const dataSource = createMockDataSource([createMockGroup()]);

        // Act
        const result = pipe.transform(dataSource, searchText as string);

        // Assert
        expect(result).toBe(dataSource);
        // MatTableDataSource initializes filter to '' by default
        expect(result.filter).toBe('');
      });

      it('should return same dataSource reference when searchText is empty string', () => {
        // Arrange
        const dataSource = createMockDataSource([createMockGroup()]);

        // Act
        const result = pipe.transform(dataSource, '');

        // Assert
        expect(result).toBe(dataSource);
      });
    });

    describe('when searchText is provided', () => {
      it('should set filter on dataSource with trimmed lowercase searchText', () => {
        // Arrange
        const dataSource = createMockDataSource([createMockGroup()]);

        // Act
        const result = pipe.transform(dataSource, '  TestGroup  ');

        // Assert
        expect(result).toBe(dataSource);
        expect(result.filter).toBe('testgroup');
      });

      it('should convert searchText to lowercase', () => {
        // Arrange
        const dataSource = createMockDataSource([createMockGroup()]);

        // Act
        const result = pipe.transform(dataSource, 'UPPERCASE');

        // Assert
        expect(result.filter).toBe('uppercase');
      });

      it('should trim whitespace from searchText', () => {
        // Arrange
        const dataSource = createMockDataSource([createMockGroup()]);

        // Act
        const result = pipe.transform(dataSource, '  spaced  ');

        // Assert
        expect(result.filter).toBe('spaced');
      });

      it('should return same dataSource reference with filter set', () => {
        // Arrange
        const dataSource = createMockDataSource([createMockGroup({ name: 'Admin' })]);

        // Act
        const result = pipe.transform(dataSource, 'admin');

        // Assert
        expect(result).toBe(dataSource);
        expect(result.filter).toBe('admin');
      });
    });

    describe('edge cases', () => {
      it('should handle searchText with only spaces', () => {
        // Arrange
        const dataSource = createMockDataSource();

        // Act
        const result = pipe.transform(dataSource, '   ');

        // Assert
        // '   '.trim().toLowerCase() === '' which is falsy, so returns unchanged
        expect(result).toBe(dataSource);
        // MatTableDataSource initializes filter to '' by default
        expect(result.filter).toBe('');
      });

      it('should handle dataSource with empty data array', () => {
        // Arrange
        const dataSource = createMockDataSource([]);

        // Act
        const result = pipe.transform(dataSource, 'search');

        // Assert
        expect(result).toBe(dataSource);
        expect(result.filter).toBe('search');
      });

      it('should handle dataSource with multiple groups', () => {
        // Arrange
        const groups = [
          createMockGroup({ name: 'Admin', user_group_id: 'grp-1' }),
          createMockGroup({ name: 'Users', user_group_id: 'grp-2' }),
          createMockGroup({ name: 'Guests', user_group_id: 'grp-3' }),
        ];
        const dataSource = createMockDataSource(groups);

        // Act
        const result = pipe.transform(dataSource, 'admin');

        // Assert
        expect(result).toBe(dataSource);
        expect(result.filter).toBe('admin');
        expect(result.data).toHaveLength(3);
      });

      it('should handle special characters in searchText', () => {
        // Arrange
        const dataSource = createMockDataSource();

        // Act
        const result = pipe.transform(dataSource, 'Group@123!');

        // Assert
        expect(result.filter).toBe('group@123!');
      });

      it('should handle numeric searchText', () => {
        // Arrange
        const dataSource = createMockDataSource();

        // Act
        const result = pipe.transform(dataSource, '12345');

        // Assert
        expect(result.filter).toBe('12345');
      });

      it('should handle searchText with unicode characters', () => {
        // Arrange
        const dataSource = createMockDataSource();

        // Act
        const result = pipe.transform(dataSource, 'admin@公司');

        // Assert
        expect(result.filter).toBe('admin@公司');
      });
    });

    describe('multiple calls', () => {
      it('should overwrite previous filter on subsequent calls', () => {
        // Arrange
        const dataSource = createMockDataSource();

        // Act
        pipe.transform(dataSource, 'first');
        const result = pipe.transform(dataSource, 'second');

        // Assert
        expect(result.filter).toBe('second');
      });

      it('should handle alternating between search and no search', () => {
        // Arrange
        const dataSource = createMockDataSource();

        // Act & Assert
        expect(pipe.transform(dataSource, 'search').filter).toBe('search');
        expect(pipe.transform(dataSource, '')).toBe(dataSource);
        expect(pipe.transform(dataSource, 'new').filter).toBe('new');
      });
    });
  });
});
