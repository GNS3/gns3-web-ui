import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchFilter } from './searchFilter.pipe';

describe('SearchFilter', () => {
  let pipe: SearchFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    pipe = new SearchFilter();
  });

  describe('transform', () => {
    it('should create the pipe', () => {
      expect(pipe).toBeTruthy();
    });

    it('should filter items by filename matching searchText', () => {
      const items = [{ filename: 'router.cfg' }, { filename: 'switch.cfg' }, { filename: 'router.conf' }];
      const result = pipe.transform(items, 'router');
      expect(result).toHaveLength(2);
      expect(result.map((item) => item.filename)).toEqual(['router.cfg', 'router.conf']);
    });

    it('should be case-insensitive when filtering', () => {
      const items = [{ filename: 'Router.cfg' }, { filename: 'SWITCH.cfg' }, { filename: 'router.cfg' }];
      const result = pipe.transform(items, 'ROUTER');
      expect(result).toHaveLength(2);
      expect(result.map((item) => item.filename)).toEqual(['Router.cfg', 'router.cfg']);
    });

    it('should return all items when searchText is empty', () => {
      const items = [{ filename: 'router.cfg' }, { filename: 'switch.cfg' }];
      const result = pipe.transform(items, '');
      expect(result).toEqual(items);
    });

    it('should return all items when searchText is null', () => {
      const items = [{ filename: 'router.cfg' }, { filename: 'switch.cfg' }];
      const result = pipe.transform(items, null as any);
      expect(result).toEqual(items);
    });

    it('should return all items when searchText is undefined', () => {
      const items = [{ filename: 'router.cfg' }, { filename: 'switch.cfg' }];
      const result = pipe.transform(items, undefined as any);
      expect(result).toEqual(items);
    });

    it('should return empty array when items is null', () => {
      const result = pipe.transform(null as any, 'router');
      expect(result).toEqual([]);
    });

    it('should return empty array when items is undefined', () => {
      const result = pipe.transform(undefined as any, 'router');
      expect(result).toEqual([]);
    });

    it('should return empty array when no items match', () => {
      const items = [{ filename: 'router.cfg' }, { filename: 'switch.cfg' }];
      const result = pipe.transform(items, 'firewall');
      expect(result).toHaveLength(0);
    });

    it('should handle partial filename matching', () => {
      const items = [
        { filename: 'my-router-config.cfg' },
        { filename: 'router.cfg' },
        { filename: 'routerswitch.cfg' },
      ];
      const result = pipe.transform(items, 'config');
      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('my-router-config.cfg');
    });

    it('should handle searchText with special characters', () => {
      const items = [{ filename: 'router-v1.cfg' }, { filename: 'router_v2.cfg' }, { filename: 'switch.cfg' }];
      const result = pipe.transform(items, '-v1');
      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('router-v1.cfg');
    });

    it('should handle items with empty filename', () => {
      const items = [{ filename: 'router.cfg' }, { filename: '' }, { filename: 'switch.cfg' }];
      const result = pipe.transform(items, 'router');
      expect(result).toHaveLength(1);
    });

    it('should handle single item array', () => {
      const items = [{ filename: 'router.cfg' }];
      const result = pipe.transform(items, 'router');
      expect(result).toHaveLength(1);
    });

    it('should handle empty items array', () => {
      const items: { filename: string }[] = [];
      const result = pipe.transform(items, 'router');
      expect(result).toHaveLength(0);
    });

    it('should match filenames containing searchText at any position', () => {
      const items = [{ filename: 'start-router-end.cfg' }, { filename: 'router.cfg' }, { filename: 'cfg-router.cfg' }];
      const result = pipe.transform(items, 'router');
      expect(result).toHaveLength(3);
    });
  });
});
