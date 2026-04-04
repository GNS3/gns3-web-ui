import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateFilter } from './templateFilter.pipe';
import { Template } from '@models/template';

describe('TemplateFilter', () => {
  let pipe: TemplateFilter;

  beforeEach(() => {
    pipe = new TemplateFilter();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty array when items is null', () => {
    const result = pipe.transform(null as any, 'test');
    expect(result).toEqual([]);
  });

  it('should return empty array when items is undefined', () => {
    const result = pipe.transform(undefined as any, 'test');
    expect(result).toEqual([]);
  });

  it('should return all items when searchText is empty', () => {
    const items: Template[] = [
      {
        name: 'Router1',
        template_id: '1',
        template_type: 'dynamips',
        builtin: false,
        category: 'router',
        compute_id: 'local',
        symbol: 'router',
        node_type: 'router',
        default_name_format: '',
      },
      {
        name: 'Switch1',
        template_id: '2',
        template_type: 'ethernet_switch',
        builtin: false,
        category: 'switch',
        compute_id: 'local',
        symbol: 'switch',
        node_type: 'switch',
        default_name_format: '',
      },
    ];
    const result = pipe.transform(items, '');
    expect(result).toEqual(items);
  });

  it('should return all items when searchText is null', () => {
    const items: Template[] = [
      {
        name: 'Router1',
        template_id: '1',
        template_type: 'dynamips',
        builtin: false,
        category: 'router',
        compute_id: 'local',
        symbol: 'router',
        node_type: 'router',
        default_name_format: '',
      },
    ];
    const result = pipe.transform(items, null as any);
    expect(result).toEqual(items);
  });

  it('should filter items by searchText (case insensitive)', () => {
    const items: Template[] = [
      {
        name: 'Router1',
        template_id: '1',
        template_type: 'dynamips',
        builtin: false,
        category: 'router',
        compute_id: 'local',
        symbol: 'router',
        node_type: 'router',
        default_name_format: '',
      },
      {
        name: 'Switch1',
        template_id: '2',
        template_type: 'ethernet_switch',
        builtin: false,
        category: 'switch',
        compute_id: 'local',
        symbol: 'switch',
        node_type: 'switch',
        default_name_format: '',
      },
      {
        name: 'router2',
        template_id: '3',
        template_type: 'dynamips',
        builtin: false,
        category: 'router',
        compute_id: 'local',
        symbol: 'router',
        node_type: 'router',
        default_name_format: '',
      },
    ];
    const result = pipe.transform(items, 'router');
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('Router1');
    expect(result[1].name).toBe('router2');
  });

  it('should return empty array when no items match', () => {
    const items: Template[] = [
      {
        name: 'Router1',
        template_id: '1',
        template_type: 'dynamips',
        builtin: false,
        category: 'router',
        compute_id: 'local',
        symbol: 'router',
        node_type: 'router',
        default_name_format: '',
      },
    ];
    const result = pipe.transform(items, 'switch');
    expect(result).toEqual([]);
  });

  it('should filter items where searchText is substring of name', () => {
    const items: Template[] = [
      {
        name: 'CloudNode',
        template_id: '1',
        template_type: 'cloud',
        builtin: false,
        category: 'guest',
        compute_id: 'local',
        symbol: 'cloud',
        node_type: 'cloud',
        default_name_format: '',
      },
      {
        name: 'DockerContainer',
        template_id: '2',
        template_type: 'docker',
        builtin: false,
        category: 'guest',
        compute_id: 'local',
        symbol: 'docker',
        node_type: 'docker',
        default_name_format: '',
      },
    ];
    const result = pipe.transform(items, 'cloud');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('CloudNode');
  });
});
