import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NodeSymbolResolverService } from './node-symbol-resolver.service';
import { SymbolService } from './symbol.service';
import { Node } from '../cartography/models/node';
import { Controller } from '@models/controller';
import { environment } from 'environments/environment';

describe('NodeSymbolResolverService', () => {
  let service: NodeSymbolResolverService;
  let mockSymbolService: any;
  const controller = {
    id: 1,
    authToken: '',
    name: 'Test Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  } as Controller;

  const node = (overrides: Partial<Node>): Node =>
    ({ symbol_url: null, width: 0, height: 0, symbol: ':/symbols/router.svg', ...overrides } as Node);

  beforeEach(() => {
    vi.clearAllMocks();

    mockSymbolService = {
      getDimensions: vi.fn().mockReturnValue(of({ width: 70, height: 30 })),
      getSymbolBlobUrl: vi.fn().mockReturnValue(of('blob:symbol')),
    };

    TestBed.configureTestingModule({
      providers: [
        NodeSymbolResolverService,
        { provide: SymbolService, useValue: mockSymbolService },
      ],
    });
    service = TestBed.inject(NodeSymbolResolverService);
  });

  it('returns the nodes untouched when every symbol_url is already set', async () => {
    const nodes = [node({ symbol_url: 'blob:existing' })];

    const result = await new Promise<Node[]>((resolve) => service.resolve(controller, nodes).subscribe(resolve));

    expect(result).toBe(nodes);
    expect(mockSymbolService.getDimensions).not.toHaveBeenCalled();
    expect(mockSymbolService.getSymbolBlobUrl).not.toHaveBeenCalled();
  });

  it('fetches dimensions only for nodes with unknown size', async () => {
    const nodes = [node({}), node({ width: 60, height: 60 })];

    await new Promise<void>((resolve) => service.resolve(controller, nodes).subscribe(() => resolve()));

    expect(mockSymbolService.getDimensions).toHaveBeenCalledTimes(1);
    expect(mockSymbolService.getDimensions).toHaveBeenCalledWith(controller, ':/symbols/router.svg');
  });

  it('fetches one blob URL per unique symbol and shares it', async () => {
    const nodes = [
      node({ node_id: 'a' }),
      node({ node_id: 'b' }),
      node({ node_id: 'c', symbol: ':/symbols/cloud.svg' }),
    ];
    mockSymbolService.getSymbolBlobUrl.mockImplementation((_: Controller, url: string) => of(`blob:${url}`));

    await new Promise<void>((resolve) => service.resolve(controller, nodes).subscribe(() => resolve()));

    expect(mockSymbolService.getSymbolBlobUrl).toHaveBeenCalledTimes(2);
    expect(mockSymbolService.getSymbolBlobUrl).toHaveBeenCalledWith(controller, '/symbols/:/symbols/router.svg/raw');
    expect(nodes[0].symbol_url).toBe('blob:/symbols/:/symbols/router.svg/raw');
    expect(nodes[1].symbol_url).toBe('blob:/symbols/:/symbols/router.svg/raw');
    expect(nodes[2].symbol_url).toBe('blob:/symbols/:/symbols/cloud.svg/raw');
  });

  it('emits only after dimensions are applied', async () => {
    const nodes = [node({})];

    await new Promise<void>((resolve) =>
      service.resolve(controller, nodes).subscribe(() => {
        expect(nodes[0].width).toBe(70);
        expect(nodes[0].height).toBe(30);
        expect(nodes[0].symbol_url).toBe('blob:symbol');
        resolve();
      })
    );
  });

  it('falls back to the raw controller URL when the blob fetch fails', async () => {
    const nodes = [node({})];
    mockSymbolService.getSymbolBlobUrl = vi.fn().mockReturnValue(throwError(() => new Error('blob failed')));

    await new Promise<void>((resolve) => service.resolve(controller, nodes).subscribe(() => resolve()));

    expect(nodes[0].symbol_url).toBe(
      `http://127.0.0.1:3080/${environment.current_version}/symbols/:/symbols/router.svg/raw`
    );
  });

  it('still completes when a dimensions fetch fails', async () => {
    const nodes = [node({})];
    mockSymbolService.getDimensions = vi.fn().mockReturnValue(throwError(() => new Error('dimensions failed')));

    await new Promise<void>((resolve) => service.resolve(controller, nodes).subscribe(() => resolve()));

    // Dimensions left untouched, but the blob URL is still assigned.
    expect(nodes[0].width).toBe(0);
    expect(nodes[0].symbol_url).toBe('blob:symbol');
  });
});
