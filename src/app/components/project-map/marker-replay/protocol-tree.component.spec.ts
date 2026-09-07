import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ProtocolTreeComponent } from './protocol-tree.component';
import { ancestorKeys, collectKeys, flattenTree, rowSearchText, rowText } from './protocol-tree';
import { ProtocolTreeNode } from '@models/marker-replay';

describe('protocol-tree pure helpers', () => {
  const ttl: ProtocolTreeNode = {
    element: 'field',
    name: 'ip.ttl',
    label: 'Time to Live: 64',
    filter_expr: 'ip.ttl == 64',
    size: '1',
    pos: '22',
    children: [],
  };
  const flags: ProtocolTreeNode = {
    element: 'field',
    name: 'ip.flags',
    label: 'Flags: 0x4000',
    children: [{ ...ttl, name: 'ip.flags.rb', label: 'Reserved bit: Not set', filter_expr: undefined }],
  };
  const ip: ProtocolTreeNode = {
    element: 'proto',
    name: 'ip',
    label: 'Internet Protocol Version 4, Src: 10.0.0.1',
    children: [ttl, flags],
  };
  const tree = [ip];

  it('flattenTree with an empty expansion set yields just the top-level protos', () => {
    const rows = flattenTree(tree, new Set());
    expect(rows.map((r) => r.key)).toEqual(['/0']);
    expect(rows[0]).toMatchObject({ depth: 0, hasChildren: true });
  });

  it('descends only into expanded keys, tracking depth', () => {
    const rows = flattenTree(tree, new Set(['/0']));
    expect(rows.map((r) => r.key)).toEqual(['/0', '/0/0', '/0/1']);
    expect(rows[1]).toMatchObject({ depth: 1, hasChildren: false });
    expect(rows[2]).toMatchObject({ depth: 1, hasChildren: true });

    const deep = flattenTree(tree, new Set(['/0', '/0/1']));
    expect(deep.map((r) => r.key)).toEqual(['/0', '/0/0', '/0/1', '/0/1/0']);
    expect(deep[3].depth).toBe(2);
  });

  it('the geninfo plumbing proto never produces rows (insurance guard)', () => {
    const geninfo: ProtocolTreeNode = {
      element: 'proto',
      name: 'geninfo',
      label: 'General information',
      children: [],
    };
    const rows = flattenTree([geninfo, ip], new Set(['/1']));
    expect(rows.map((r) => r.node.name)).toEqual(['ip', 'ip.ttl', 'ip.flags']);
    expect(collectKeys([geninfo, ip])).toEqual(['/1', '/1/1']);
  });

  it('collectKeys returns every child-bearing key (the expand-all set)', () => {
    expect(collectKeys(tree)).toEqual(['/0', '/0/1']);
  });

  it('rowText is the sharkd display label', () => {
    expect(rowText(ttl)).toBe('Time to Live: 64');
  });

  it('rowSearchText joins name + label lowercased; filter_expr is not part of the haystack', () => {
    expect(rowSearchText(ttl)).toBe('ip.ttl time to live: 64');
    // The ready-made filter expression ("ip.ttl == 64") must not leak hits.
    expect(rowSearchText(ttl)).not.toContain('== 64');
  });

  it('ancestorKeys walks the index path upward, stopping at the root', () => {
    expect(ancestorKeys('/0/1/2')).toEqual(['/0/1', '/0']);
    expect(ancestorKeys('/0')).toEqual([]);
  });

  it('rows carry a semantic name-path (the diff keyspace), occurrence-disambiguated', () => {
    const rows = flattenTree(tree, new Set(['/0', '/0/1']));
    expect(rows.map((r) => r.path)).toEqual(['ip', 'ip/ip.ttl', 'ip/ip.flags', 'ip/ip.flags/ip.flags.rb']);

    // A repeated sibling name gets [k] suffixes so paths never collide.
    const repeats: ProtocolTreeNode[] = [
      {
        element: 'proto',
        name: 'tcp',
        label: 'Transmission Control Protocol',
        children: [
          { ...ttl, name: 'tcp.option', label: 'First option' },
          { ...ttl, name: 'tcp.option', label: 'Second option' },
        ],
      },
    ];
    expect(flattenTree(repeats, new Set(['/0'])).map((r) => r.path)).toEqual([
      'tcp',
      'tcp/tcp.option[0]',
      'tcp/tcp.option[1]',
    ]);
  });
});

describe('ProtocolTreeComponent', () => {
  let fixture: ComponentFixture<ProtocolTreeComponent>;
  let component: ProtocolTreeComponent;
  /** Element appended to the body inside a test (focus needs attachment). */
  let attached: HTMLElement | null = null;

  const ttl: ProtocolTreeNode = {
    element: 'field',
    name: 'ip.ttl',
    label: 'Time to Live: 64',
    filter_expr: 'ip.ttl == 64',
    size: '1',
    pos: '22',
    children: [],
  };
  const ipProto: ProtocolTreeNode = {
    element: 'proto',
    name: 'ip',
    label: 'Internet Protocol Version 4, Src: 10.0.0.1, Dst: 10.0.0.2',
    children: [ttl, { ...ttl, name: 'ip.checksum', label: 'Header Checksum: 0x1234', filter_expr: undefined }],
  };

  // Per the unit-testing skill: zoneless async tests run under fake timers
  // (real macrotask awaits starve) — they also flush the search effects.
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({ imports: [ProtocolTreeComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProtocolTreeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tree', [ipProto]);
  });

  afterEach(() => {
    // Track DOM appended to the body (focus tests) so failures can't leak it.
    if (attached) {
      attached.remove();
      attached = null;
    }
    vi.clearAllTimers();
    if (fixture) fixture.destroy();
  });

  function rows(): NodeListOf<Element> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll('.gns3-replay__tree-row');
  }

  it('starts fully collapsed — only protocol rows are visible', () => {
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Internet Protocol Version 4');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Time to Live');
  });

  it('clicking a protocol row selects it and expands its children', () => {
    fixture.detectChanges();
    (rows()[0] as HTMLElement).click();
    fixture.detectChanges();

    expect(rows().length).toBe(3); // proto + ttl + checksum
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Time to Live: 64');
    expect(rows()[0].classList).toContain('gns3-replay__tree-row--selected');

    (rows()[0] as HTMLElement).click(); // collapse again
    fixture.detectChanges();
    expect(rows().length).toBe(1);
  });

  it('selection is single — clicking another row moves the highlight', () => {
    fixture.detectChanges();
    (rows()[0] as HTMLElement).click();
    fixture.detectChanges();
    (rows()[1] as HTMLElement).click();
    fixture.detectChanges();

    const selected = (fixture.nativeElement as HTMLElement).querySelectorAll('.gns3-replay__tree-row--selected');
    expect(selected.length).toBe(1);
    expect(selected[0].textContent).toContain('Time to Live');
  });

  it('guide rails render one column per ancestor depth', () => {
    fixture.detectChanges();
    (rows()[0] as HTMLElement).click();
    fixture.detectChanges();

    const depth1 = rows()[1] as HTMLElement;
    expect(depth1.querySelectorAll('.gns3-replay__tree-guide').length).toBe(1);
    expect((rows()[0] as HTMLElement).querySelectorAll('.gns3-replay__tree-guide').length).toBe(0);
  });

  it('Expand all opens every level; Collapse all returns to the protocol list', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll<HTMLButtonElement>('.gns3-replay__tree-tool');
    expect(buttons.length).toBe(3); // expand, collapse, 🔍

    buttons[0].click(); // expand all
    fixture.detectChanges();
    expect(rows().length).toBe(3);

    buttons[1].click(); // collapse all
    fixture.detectChanges();
    expect(rows().length).toBe(1);
  });

  it('leaf rows show a spacer instead of a chevron', () => {
    fixture.detectChanges();
    (rows()[0] as HTMLElement).click();
    fixture.detectChanges();

    const leaf = rows()[1] as HTMLElement;
    expect(leaf.querySelector('.gns3-replay__tree-chevron')).toBeNull();
    expect(leaf.querySelector('.gns3-replay__tree-leaf')).toBeTruthy();
  });

  it('a field with filter_expr shows an Apply-as-filter button that emits without selecting', () => {
    fixture.detectChanges();
    (rows()[0] as HTMLElement).click();
    fixture.detectChanges();

    const ttlRow = rows()[1] as HTMLElement;
    const btn = ttlRow.querySelector<HTMLButtonElement>('.gns3-replay__tree-filter-btn');
    expect(btn).toBeTruthy();
    expect(ttlRow.querySelector('.gns3-replay__tree-filter-btn')).toBeTruthy(); // checksum has no expr → none

    const emitted: string[] = [];
    component.applyFilter.subscribe((e) => emitted.push(e));
    btn!.click();
    fixture.detectChanges();

    expect(emitted).toEqual(['ip.ttl == 64']);
    // stopPropagation: the row itself neither selects nor toggles.
    expect(ttlRow.classList).not.toContain('gns3-replay__tree-row--selected');
    expect(rows().length).toBe(3);
  });

  it('generated (protocol-added) rows render with the italic variant', () => {
    fixture.componentRef.setInput('tree', [
      { ...ipProto, children: [{ ...ttl, generated: true }] },
    ]);
    fixture.detectChanges();
    (rows()[0] as HTMLElement).click();
    fixture.detectChanges();

    expect(rows()[1].classList).toContain('gns3-replay__tree-row--generated');
  });

  describe('cross-window diff highlight', () => {
    it('a changed leaf lights up and its collapsed ancestor is flagged', () => {
      fixture.componentRef.setInput('changedPaths', new Set(['ip/ip.ttl']));
      fixture.detectChanges();

      // Collapsed: the ip proto row carries the subtle "changed inside" flag.
      expect(rows()[0].classList).toContain('gns3-replay__tree-row--changed-subtree');
      expect(rows()[0].classList).not.toContain('gns3-replay__tree-row--changed');

      (rows()[0] as HTMLElement).click(); // expand
      fixture.detectChanges();
      const leaf = rows()[1];
      expect(leaf.classList).toContain('gns3-replay__tree-row--changed');
      expect(leaf.classList).not.toContain('gns3-replay__tree-row--changed-subtree');

      // The toolbar shows the differing-field count.
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('1 differ');
    });

    it('unchanged paths render without diff classes; null clears everything', () => {
      fixture.componentRef.setInput('changedPaths', new Set(['eth/eth.src']));
      fixture.detectChanges();
      (rows()[0] as HTMLElement).click();
      fixture.detectChanges();
      expect(rows()[0].classList).not.toContain('gns3-replay__tree-row--changed-subtree');
      expect(rows()[1].classList).not.toContain('gns3-replay__tree-row--changed');

      fixture.componentRef.setInput('changedPaths', null);
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('differ');
    });
  });

  describe('text search', () => {
    // eth › ip › {ttl, flags › rb} — matches can hide TWO levels deep.
    const rb: ProtocolTreeNode = { ...ttl, name: 'ip.flags.rb', label: 'Reserved bit: Not set', filter_expr: undefined };
    const flags: ProtocolTreeNode = { ...ttl, name: 'ip.flags', label: 'Flags: 0x4000', filter_expr: undefined, children: [rb] };
    const deepTree: ProtocolTreeNode[] = [
      {
        element: 'proto',
        name: 'eth',
        label: 'Ethernet II, Src: 00:11:22:33:44:55',
        children: [
          {
            element: 'proto',
            name: 'ip',
            label: 'Internet Protocol Version 4, Src: 10.0.0.1',
            children: [ttl, flags],
          },
        ],
      },
    ];

    /** Effects (auto-expand, scroll, focus) flush under fake timers, then re-render. */
    async function flush() {
      await vi.runAllTimersAsync();
      fixture.detectChanges();
    }

    it('reveals matches inside collapsed branches, highlights them and shows n/m', async () => {
      fixture.componentRef.setInput('tree', deepTree);
      fixture.detectChanges();
      expect(rows().length).toBe(1); // collapsed start

      fixture.componentRef.setInput('searchQuery', 'time to live');
      await flush();

      // Ancestors auto-expanded: eth › ip › ip.ttl visible; the flags sibling
      // still renders (collapsed — a row exists whether or not it's open).
      expect(rows().length).toBe(4);
      const hit = rows()[2] as HTMLElement;
      expect(hit.getAttribute('data-key')).toBe('/0/0/0');
      expect(hit.classList).toContain('gns3-replay__tree-row--match');
      expect(hit.classList).toContain('gns3-replay__tree-row--match-current');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('1/1');
    });

    it('matching is case-insensitive over names and labels; filter_expr never leaks hits', async () => {
      fixture.componentRef.setInput('tree', deepTree);
      fixture.detectChanges();

      fixture.componentRef.setInput('searchQuery', 'TTL'); // field NAME hit
      await flush();
      expect(component.matchCount()).toBe(1);

      fixture.componentRef.setInput('searchQuery', 'RESERVED'); // label hit, case-folded
      await flush();
      expect(component.matchCount()).toBe(1); // the rb row
      // eth › ip › ttl › flags(open) › rb — every level revealed.
      expect(rows().length).toBe(5);

      // "40" appears in ttl's filter_expr ("ip.ttl == 64" has none, but the
      // expr format "== 64" must not match) and in flags' label "0x4000".
      fixture.componentRef.setInput('searchQuery', '40');
      await flush();
      expect(component.matchCount()).toBe(1);
      expect(component.matches()[0].node.name).toBe('ip.flags');

      fixture.componentRef.setInput('searchQuery', '== 64'); // expr-only text
      await flush();
      expect(component.matchCount()).toBe(0);
    });

    it('Enter walks the matches in order with wraparound; Shift+Enter goes back', async () => {
      fixture.componentRef.setInput('tree', deepTree);
      fixture.componentRef.setInput('searchQuery', 'flags'); // hits ip.flags + ip.flags.rb
      await flush();
      expect(component.matchCount()).toBe(2);
      expect(component.currentMatchKey()).toBe('/0/0/1');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('1/2');

      const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
        '.gns3-replay__search-input'
      )!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await flush();
      expect(component.currentMatchKey()).toBe('/0/0/1/0');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('2/2');

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await flush(); // wraps back to the first
      expect(component.currentMatchKey()).toBe('/0/0/1');

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }));
      await flush(); // Shift+Enter steps backwards
      expect(component.currentMatchKey()).toBe('/0/0/1/0');
    });

    it('clearing the query drops the highlights but keeps the revealed branches', async () => {
      fixture.componentRef.setInput('tree', deepTree);
      fixture.componentRef.setInput('searchQuery', 'time to live');
      await flush();
      expect(rows().length).toBe(4); // eth › ip › ttl + collapsed flags

      fixture.componentRef.setInput('searchQuery', '');
      await flush();

      expect(component.matchCount()).toBe(0);
      expect(rows().length).toBe(4); // still expanded — browse what search opened
      rows().forEach((r) => expect(r.classList).not.toContain('gns3-replay__tree-row--match'));
    });

    it('🔍 opens the bar focused; Esc closes it and clears the query', async () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      document.body.appendChild(el); // jsdom only assigns focus to attached elements
      attached = el;

      const searchBtn = el.querySelectorAll<HTMLButtonElement>('.gns3-replay__tree-tool')[2];
      searchBtn.click();
      await flush();

      const input = el.querySelector<HTMLInputElement>('.gns3-replay__search-input')!;
      expect(input).toBeTruthy();
      expect(document.activeElement).toBe(input);

      input.value = 'ttl'; // typing publishes the (model) query
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();
      expect(component.searchQuery()).toBe('ttl');

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await flush();
      expect(component.searchQuery()).toBe('');
      expect(el.querySelector('.gns3-replay__search-input')).toBeNull();
    });
  });
});
