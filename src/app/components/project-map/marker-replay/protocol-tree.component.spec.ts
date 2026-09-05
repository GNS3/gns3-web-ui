import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ProtocolTreeComponent } from './protocol-tree.component';
import { ancestorKeys, collectKeys, flattenTree, rowSearchText, rowText } from './protocol-tree';
import { ProtocolTreeNode } from '@models/marker-replay';

describe('protocol-tree pure helpers', () => {
  const ttl: ProtocolTreeNode = {
    element: 'field',
    name: 'ip.ttl',
    showname: 'Time to Live: 64',
    show: '64',
    value: '40',
    size: '1',
    pos: '22',
    children: [],
  };
  const flags: ProtocolTreeNode = {
    element: 'field',
    name: 'ip.flags',
    showname: 'Flags: 0x4000',
    children: [{ ...ttl, name: 'ip.flags.rb', showname: 'Reserved bit: Not set' }],
  };
  const ip: ProtocolTreeNode = {
    element: 'proto',
    name: 'ip',
    showname: 'Internet Protocol Version 4, Src: 10.0.0.1',
    children: [ttl, flags, { ...ttl, name: 'ip.padding', hide: 'yes' }],
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

  it('hide="yes" fields never produce rows (real tshark marks filter-only combination fields this way)', () => {
    const rows = flattenTree(tree, new Set(['/0']));
    expect(rows.some((r) => r.node.name === 'ip.padding')).toBe(false);
  });

  it('drops hide="yes" AND hide="true", plus the geninfo plumbing proto', () => {
    const geninfo: ProtocolTreeNode = {
      element: 'proto',
      name: 'geninfo',
      showname: 'General information',
      children: [],
    };
    const real = [
      geninfo,
      {
        ...ip,
        children: [
          ttl,
          { ...ttl, name: 'ip.addr', showname: 'Source or Destination Address: 10.1.10.101', hide: 'yes' },
          { ...ttl, name: 'ip.host', showname: 'Source or Destination Host: 10.1.10.101', hide: 'true' },
        ],
      },
    ];
    const rows = flattenTree(real, new Set(['/1']));
    expect(rows.map((r) => r.node.name)).toEqual(['ip', 'ip.ttl']);
    expect(collectKeys(real)).toEqual(['/1']);
  });

  it('collectKeys returns every child-bearing key (the expand-all set)', () => {
    expect(collectKeys(tree)).toEqual(['/0', '/0/1']);
  });

  it('rowText prefers showname, falls back to "name: show", then the name', () => {
    expect(rowText(ttl)).toBe('Time to Live: 64');
    expect(rowText({ ...ttl, showname: undefined })).toBe('ip.ttl: 64');
    expect(rowText({ ...ttl, showname: undefined, show: undefined })).toBe('ip.ttl');
  });

  it('rowSearchText joins name + displayed text lowercased; the raw hex value never matches', () => {
    expect(rowSearchText(ttl)).toBe('ip.ttl time to live: 64');
    expect(rowSearchText({ ...ttl, showname: undefined })).toBe('ip.ttl 64');
    const fcs = { ...ttl, name: 'ip.fcs', showname: 'Frame check sequence', show: undefined, value: 'deadbeef' };
    expect(rowSearchText(fcs)).not.toContain('deadbeef');
  });

  it('ancestorKeys walks the index path upward, stopping at the root', () => {
    expect(ancestorKeys('/0/1/2')).toEqual(['/0/1', '/0']);
    expect(ancestorKeys('/0')).toEqual([]);
  });

  it('rows carry a semantic name-path (the diff keyspace), occurrence-disambiguated', () => {
    const rows = flattenTree(tree, new Set(['/0', '/0/1']));
    expect(rows.map((r) => r.path)).toEqual(['ip', 'ip/ip.ttl', 'ip/ip.flags', 'ip/ip.flags/ip.flags.rb']);

    // A repeated sibling name gets [k] suffixes so paths never collide — even
    // when a hidden field sits between them (hidden nodes stay uncounted).
    const repeats: ProtocolTreeNode[] = [
      {
        element: 'proto',
        name: 'tcp',
        showname: 'TCP',
        children: [
          { ...ttl, name: 'tcp.option' },
          { ...ttl, name: 'tcp.pad', hide: 'yes' },
          { ...ttl, name: 'tcp.option', showname: 'Second option' },
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
    showname: 'Time to Live: 64',
    show: '64',
    value: '40',
    size: '1',
    pos: '22',
    children: [],
  };
  const ipProto: ProtocolTreeNode = {
    element: 'proto',
    name: 'ip',
    showname: 'Internet Protocol Version 4, Src: 10.0.0.1, Dst: 10.0.0.2',
    children: [ttl, { ...ttl, name: 'ip.checksum', showname: 'Header Checksum: 0x1234', hide: 'yes' }],
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

  it('clicking a protocol row selects it and expands its children; hide fields stay out', () => {
    fixture.detectChanges();
    (rows()[0] as HTMLElement).click();
    fixture.detectChanges();

    expect(rows().length).toBe(2); // proto + ttl (checksum is hide="true")
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
    expect(rows().length).toBe(2); // proto + ttl in this fixture

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
    const rb: ProtocolTreeNode = { ...ttl, name: 'ip.flags.rb', showname: 'Reserved bit: Not set' };
    const flags: ProtocolTreeNode = { ...ttl, name: 'ip.flags', showname: 'Flags: 0x4000', children: [rb] };
    const deepTree: ProtocolTreeNode[] = [
      {
        element: 'proto',
        name: 'eth',
        showname: 'Ethernet II, Src: 00:11:22:33:44:55',
        children: [
          {
            element: 'proto',
            name: 'ip',
            showname: 'Internet Protocol Version 4, Src: 10.0.0.1',
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

    it('matching is case-insensitive over names and display text, never the raw hex value', async () => {
      fixture.componentRef.setInput('tree', deepTree);
      fixture.detectChanges();

      fixture.componentRef.setInput('searchQuery', 'TTL'); // field NAME hit
      await flush();
      expect(component.matchCount()).toBe(1);

      fixture.componentRef.setInput('searchQuery', 'RESERVED'); // showname hit, case-folded
      await flush();
      expect(component.matchCount()).toBe(1); // the rb row
      // eth › ip › ttl › flags(open) › rb — every level revealed.
      expect(rows().length).toBe(5);

      // "40" appears in ttl's hex VALUE and in flags' "0x4000" showname — only
      // the displayed text counts.
      fixture.componentRef.setInput('searchQuery', '40');
      await flush();
      expect(component.matchCount()).toBe(1);
      expect(component.matches()[0].node.name).toBe('ip.flags');
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
