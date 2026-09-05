import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { MarkerManagerComponent } from './marker-manager.component';
import { MarkerService } from '@services/marker.service';
import { LinkService } from '@services/link.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { MapLinksDataSource } from '../../../cartography/datasources/map-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { MarkerRegistryService } from '@services/marker-registry.service';
import { ToasterService } from '@services/toaster.service';
import { WindowBoundaryService } from '@services/window-boundary.service';
import { WindowManagementService } from '@services/window-management.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';

describe('MarkerManagerComponent', () => {
  let fixture: ComponentFixture<MarkerManagerComponent>;
  let component: MarkerManagerComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let markerService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let linkService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let registry: any;

  const controller = { id: 1 } as Controller;
  const project = { project_id: 'proj-1' } as Project;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let linksDataSource: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mapLinksDataSource: any;

  beforeEach(async () => {
    markerService = {
      listDefinitions: vi.fn(),
      createDefinition: vi.fn(),
      updateDefinition: vi.fn(),
      deleteDefinition: vi.fn(),
      pauseDefinition: vi.fn(),
      aggregateList: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      setEnabled: vi.fn(),
    };
    linkService = { getLink: vi.fn() };
    registry = { reconcileLink: vi.fn(), rebuildFromAggregate: vi.fn(), removeLink: vi.fn() };
    linksDataSource = { get: vi.fn(), update: vi.fn(), getItems: vi.fn(() => []) };
    mapLinksDataSource = { get: vi.fn(), update: vi.fn(), getItems: vi.fn(() => []) };

    await TestBed.configureTestingModule({
      imports: [MarkerManagerComponent],
      providers: [
        { provide: MarkerService, useValue: markerService },
        { provide: LinkService, useValue: linkService },
        { provide: LinksDataSource, useValue: linksDataSource },
        { provide: MapLinksDataSource, useValue: mapLinksDataSource },
        { provide: NodesDataSource, useValue: { get: vi.fn(), getItems: vi.fn(() => []) } },
        { provide: MarkerRegistryService, useValue: registry },
        { provide: ToasterService, useValue: { success: vi.fn(), error: vi.fn() } },
        {
          provide: WindowBoundaryService,
          useValue: { setConfig: vi.fn(), constrainResizeSize: vi.fn() },
        },
        {
          provide: WindowManagementService,
          useValue: {
            minimizedWindows: vi.fn(() => []),
            toggleMinimize: vi.fn(),
            restoreWindow: vi.fn(),
            isMinimized: vi.fn(() => false),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkerManagerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controller', controller);
    fixture.componentRef.setInput('project', project);
  });

  it('loads definitions and aggregate on init', () => {
    markerService.listDefinitions.mockReturnValue(
      of({ arp: { bpf: 'arp', tag: 5, link_ids: ['a', 'b'] } })
    );
    markerService.aggregateList.mockReturnValue(
      of({ 'l1/global-arp': { bpf: 'arp', link_id: 'l1', inherited_from: 'arp' } })
    );

    fixture.detectChanges(); // triggers ngOnInit

    expect(component.definitions().length).toBe(1);
    expect(component.definitions()[0]).toMatchObject({ name: 'arp', bpf: 'arp', linkCount: 2 });
    expect(component.linkGroups().length).toBe(1);
    expect(component.linkGroups()[0].markers[0].name).toBe('global-arp');
  });

  describe('Definitions tab', () => {
    beforeEach(() => {
      markerService.listDefinitions.mockReturnValue(of({}));
      markerService.aggregateList.mockReturnValue(of({}));
      fixture.detectChanges();
    });

    it('creates a definition then reloads', () => {
      markerService.createDefinition.mockReturnValue(of({}));
      markerService.listDefinitions.mockClear();
      markerService.aggregateList.mockClear();

      component.definitionForm.setValue({
        name: 'icmp',
        bpf: 'icmp',
        tag: 1,
        color: null,
        highlight_duration: 800,
        direction: null,
        data_link_type: null,
      });
      component.submitDefinition();

      expect(markerService.createDefinition).toHaveBeenCalledWith(
        controller,
        'proj-1',
        // Definitions are direction-agnostic, so the form always maps to 'both'
        // (dirToBody) and submitDefinition() sends it explicitly to clear any filter.
        // data_link_type is null (Ethernet-only default) ⇒ omitted from the body.
        { name: 'icmp', bpf: 'icmp', tag: 1, highlight_duration: 800, direction: 'both' }
      );
      expect(markerService.listDefinitions).toHaveBeenCalled();
      expect(markerService.aggregateList).toHaveBeenCalled();
      expect(component.editingDefinition()).toBeNull();
    });

    it('rejects a name starting with "global"', () => {
      component.definitionForm.setValue({
        name: 'global-foo',
        bpf: 'icmp',
        tag: null,
        color: null,
        highlight_duration: null,
        direction: null,
        data_link_type: null,
      });
      component.submitDefinition();
      expect(markerService.createDefinition).not.toHaveBeenCalled();
    });

    it('surfaces a server error on create', () => {
      markerService.createDefinition.mockReturnValue(
        throwError(() => ({ error: { message: 'Invalid BPF expression: foo bar' } }))
      );
      component.definitionForm.setValue({
        name: 'bad',
        bpf: 'foo bar',
        tag: null,
        color: null,
        highlight_duration: 500,
        direction: null,
        data_link_type: null,
      });
      component.submitDefinition();
      expect(component.defError()).toContain('Invalid BPF expression');
    });
  });

  describe('Links tab', () => {
    beforeEach(() => {
      markerService.listDefinitions.mockReturnValue(of({}));
      markerService.aggregateList.mockReturnValue(
        of({
          'l1/global-arp': { bpf: 'arp', link_id: 'l1', inherited_from: 'arp' },
          'l1/private-1': { bpf: 'tcp', link_id: 'l1' },
        })
      );
      fixture.detectChanges();
    });

    it('marks inherited markers read-only (name resolved, no inherited_from on private)', () => {
      const group = component.linkGroups()[0];
      const inherited = group.markers.find((m) => m.inherited_from);
      const priv = group.markers.find((m) => !m.inherited_from);
      expect(inherited?.inherited_from).toBe('arp');
      expect(priv?.inherited_from).toBeUndefined();
    });

    it('deletes a private marker then refreshes the link + aggregate', () => {
      markerService.delete.mockReturnValue(of(undefined));
      linkService.getLink.mockReturnValue(of({ link_id: 'l1', markers: {} }));
      markerService.aggregateList.mockClear();

      component.deleteMarker('l1', 'private-1');

      expect(markerService.delete).toHaveBeenCalledWith(controller, 'proj-1', 'l1', 'private-1');
      expect(linkService.getLink).toHaveBeenCalledWith(controller, 'proj-1', 'l1');
      expect(registry.reconcileLink).toHaveBeenCalled();
      expect(markerService.aggregateList).toHaveBeenCalled();
    });
  });

  describe('aggregate race', () => {
    it('drops a stale aggregate response resolving after a newer one', () => {
      // Regression: two overlapping aggregate GETs (loadAggregate fires after
      // every marker CRUD). The older, pre-mutation response must not apply
      // last — its clearing loop would wipe markers that were just created.
      const link = { link_id: 'l1', name: 'l1', markers: {} };
      linksDataSource.get.mockReturnValue(link);
      linksDataSource.getItems.mockReturnValue([link]);
      mapLinksDataSource.getItems.mockReturnValue([]);

      const stale = new Subject<any>();
      const fresh = new Subject<any>();
      markerService.aggregateList.mockReturnValueOnce(stale.asObservable()).mockReturnValueOnce(fresh.asObservable());

      component.loadAggregate(); // request #1 (older)
      component.loadAggregate(); // request #2 (newer)

      // Newer response lands first and carries the just-created marker.
      // (No `color` hex here — the hardcoded-colors pre-commit check flags
      // hex literals in staged files, and this test never asserts the value.)
      fresh.next({ 'l1/mymarker': { bpf: 'ip', link_id: 'l1' } });
      fresh.complete();
      expect(link.markers).toHaveProperty('mymarker');

      // Older (pre-mutation) response lands last — must be ignored.
      stale.next({});
      stale.complete();

      expect(link.markers).toHaveProperty('mymarker');
    });
  });

  describe('Replay tab (tag aggregate)', () => {
    /** Aggregate with tag 5 on two links (one still capturing) and paused tag 9. */
    const aggregate = () => ({
      'l1/global-arp': { bpf: 'arp', link_id: 'l1', node_id: 'n1', tag: 5, inherited_from: 'arp' },
      'l2/global-arp': { bpf: 'arp', link_id: 'l2', node_id: 'n2', tag: 5, inherited_from: 'arp', enabled: false },
      'l2/private-x': { bpf: 'icmp', link_id: 'l2', node_id: 'n2', tag: 5 },
      'l1/global-web': { bpf: 'tcp port 80', link_id: 'l1', node_id: 'n1', tag: 9, enabled: false },
    });

    beforeEach(() => {
      markerService.listDefinitions.mockReturnValue(of({}));
      markerService.pauseDefinition.mockReturnValue(of({}));
      markerService.aggregateList.mockReturnValue(of(aggregate()));
      fixture.detectChanges();
    });

    it('groups aggregate markers by tag client-side', () => {
      const tags = component.tags();
      expect(tags.map((t) => t.tag)).toEqual([5, 9]);

      const tag5 = tags[0];
      expect(tag5.markers).toHaveLength(3);
      expect(tag5.linkCount).toBe(2); // l1 + l2
      expect(tag5.enabled.map((m) => m.name)).toEqual(['global-arp', 'private-x']); // l2's copy is paused

      const tag9 = tags[1];
      expect(tag9.enabled).toHaveLength(0);
      expect(tag9.linkCount).toBe(1);
    });

    it('Replay emits immediately when nothing under the tag is capturing', () => {
      const emitted = vi.fn();
      component.startReplay.subscribe(emitted);

      component.startReplayFor(component.tags()[1]); // tag 9, all paused
      expect(emitted).toHaveBeenCalledWith(9);
      expect(component.pausePanelTag()).toBeNull();
    });

    it('capturing tags open the pause panel instead of emitting', () => {
      const emitted = vi.fn();
      component.startReplay.subscribe(emitted);

      component.startReplayFor(component.tags()[0]); // tag 5, two capturing
      expect(emitted).not.toHaveBeenCalled();
      expect(component.pausePanelTag()).toBe(5);
    });

    it('pauseAllAndReplay routes inherited copies via their definition, private ones per-link', () => {
      const emitted = vi.fn();
      component.startReplay.subscribe(emitted);
      markerService.setEnabled.mockReturnValue(of({}));
      markerService.aggregateList.mockClear();
      markerService.listDefinitions.mockClear();

      component.pauseAllAndReplay(component.tags()[0]);

      // tag 5 enabled = l1/global-arp (inherited from 'arp') + l2/private-x.
      // The server rejects per-link writes on inherited markers, so the ONE
      // definition pause covers both global-arp copies (incl. l2's paused one);
      // only the private marker takes the per-link fast path.
      expect(markerService.pauseDefinition).toHaveBeenCalledTimes(1);
      expect(markerService.pauseDefinition).toHaveBeenCalledWith(controller, 'proj-1', 'arp');
      expect(markerService.setEnabled).toHaveBeenCalledTimes(1);
      expect(markerService.setEnabled).toHaveBeenCalledWith(controller, 'proj-1', 'l2', 'private-x', false);
      expect(markerService.aggregateList).toHaveBeenCalled(); // refreshed aggregate
      expect(markerService.listDefinitions).toHaveBeenCalled(); // paused flags refreshed
      expect(emitted).toHaveBeenCalledWith(5);
      expect(component.pausingTag()).toBeNull();
      expect(component.pausePanelTag()).toBeNull();
    });

    it('pauseAllAndReplay surfaces failures and does not emit', () => {
      const emitted = vi.fn();
      component.startReplay.subscribe(emitted);
      markerService.setEnabled.mockReturnValue(
        throwError(() => ({ error: { message: 'nope' }, message: 'nope' }))
      );

      component.startReplayFor(component.tags()[0]); // opens the pause panel
      expect(component.pausePanelTag()).toBe(5);
      component.pauseAllAndReplay(component.tags()[0]);

      expect(emitted).not.toHaveBeenCalled();
      expect(component.pausingTag()).toBeNull();
      expect(component.pausePanelTag()).toBe(5); // panel stays open for a retry
    });
  });
});
