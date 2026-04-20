import { describe, it, expect, beforeEach } from 'vitest';
import { NameFilter } from './nameFilter.pipe';

describe('NameFilter', () => {
  let pipe: NameFilter;

  beforeEach(() => {
    pipe = new NameFilter();
  });

  describe('transform', () => {
    describe('null/undefined handling', () => {
      it('should return empty array when items is null', () => {
        expect(pipe.transform(null as any, 'test')).toEqual([]);
      });

      it('should return empty array when items is undefined', () => {
        expect(pipe.transform(undefined as any, 'test')).toEqual([]);
      });
    });

    describe('empty search text', () => {
      it('should return all items when searchText is empty string', () => {
        const items = [{ name: 'Router1' }, { name: 'Switch1' }];
        expect(pipe.transform(items, '')).toEqual(items);
      });

      it('should return all items when searchText is null', () => {
        const items = [{ name: 'Router1' }, { name: 'Switch1' }];
        expect(pipe.transform(items, null as any)).toEqual(items);
      });

      it('should return all items when searchText is undefined', () => {
        const items = [{ name: 'Router1' }, { name: 'Switch1' }];
        expect(pipe.transform(items, undefined as any)).toEqual(items);
      });
    });

    describe('filtering', () => {
      it('should filter items by name matching searchText', () => {
        const items = [{ name: 'Router1' }, { name: 'Switch1' }, { name: 'Router2' }];
        expect(pipe.transform(items, 'Router')).toEqual([{ name: 'Router1' }, { name: 'Router2' }]);
      });

      it('should be case insensitive', () => {
        const items = [{ name: 'Router1' }, { name: 'switch1' }, { name: 'ROUTER2' }];
        expect(pipe.transform(items, 'router')).toEqual([{ name: 'Router1' }, { name: 'ROUTER2' }]);
      });

      it('should return empty array when no items match', () => {
        const items = [{ name: 'Router1' }, { name: 'Switch1' }];
        expect(pipe.transform(items, 'Firewall')).toEqual([]);
      });

      it('should handle partial matches', () => {
        const items = [{ name: 'Router1' }, { name: 'Switch1' }, { name: 'Router2' }];
        expect(pipe.transform(items, 'sw')).toEqual([{ name: 'Switch1' }]);
      });

      it('should return empty array when items is empty', () => {
        expect(pipe.transform([], 'test')).toEqual([]);
      });
    });
  });
});
