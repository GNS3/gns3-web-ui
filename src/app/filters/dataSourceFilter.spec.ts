import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataSourceFilter } from './dataSourceFilter';

describe('DataSourceFilter', () => {
  let pipe: DataSourceFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    pipe = new DataSourceFilter();
  });

  describe('transform', () => {
    describe('should return empty array when items is falsy', () => {
      it.each([null, undefined])('items: %s', (items) => {
        expect(pipe.transform(items, 'test')).toEqual([]);
      });
    });

    describe('should return items as-is when searchText is empty', () => {
      it.each(['', null, undefined])('searchText: %s', (searchText) => {
        const items = { filteredData: [{ name: 'Server1' }, { name: 'Server2' }] };
        expect(pipe.transform(items, searchText)).toEqual(items);
      });
    });

    describe('should filter items by name (case-insensitive)', () => {
      it('should return matching items', () => {
        const items = {
          filteredData: [
            { name: 'Server1' },
            { name: 'Server2' },
            { name: 'Database' },
          ],
        };
        expect(pipe.transform(items, 'server')).toEqual([{ name: 'Server1' }, { name: 'Server2' }]);
      });

      it('should be case-insensitive', () => {
        const items = {
          filteredData: [
            { name: 'SERVER1' },
            { name: 'server2' },
            { name: 'Server3' },
          ],
        };
        expect(pipe.transform(items, 'Server')).toHaveLength(3);
      });

      it('should return empty array when no matches', () => {
        const items = {
          filteredData: [{ name: 'Server1' }, { name: 'Server2' }],
        };
        expect(pipe.transform(items, 'nonexistent')).toEqual([]);
      });

      it('should filter partial matches', () => {
        const items = {
          filteredData: [
            { name: 'MySQL Server' },
            { name: 'MySQL Database' },
            { name: 'PostgreSQL' },
          ],
        };
        expect(pipe.transform(items, 'MySQL')).toHaveLength(2);
      });
    });

    describe('should handle items with missing or invalid name property', () => {
      it('should throw when item has missing name', () => {
        const items = {
          filteredData: [{ name: 'Server1' }, { notName: 'value' }],
        };
        expect(() => pipe.transform(items, 'server')).toThrow(TypeError);
      });

      it('should throw when item has null name', () => {
        const items = {
          filteredData: [{ name: 'Server1' }, { name: null }],
        };
        expect(() => pipe.transform(items, 'server')).toThrow(TypeError);
      });
    });

    describe('should handle edge cases', () => {
      it('should handle empty filteredData array', () => {
        const items = { filteredData: [] };
        expect(pipe.transform(items, 'test')).toEqual([]);
      });

      it('should handle searchText with special characters', () => {
        const items = {
          filteredData: [{ name: 'Server-1' }, { name: 'Server_2' }],
        };
        expect(pipe.transform(items, '-')).toEqual([{ name: 'Server-1' }]);
        expect(pipe.transform(items, '_')).toEqual([{ name: 'Server_2' }]);
      });

      it('should handle searchText with spaces', () => {
        const items = {
          filteredData: [{ name: 'My Server' }, { name: 'MyDatabase' }],
        };
        expect(pipe.transform(items, 'My ')).toEqual([{ name: 'My Server' }]);
      });
    });
  });
});
