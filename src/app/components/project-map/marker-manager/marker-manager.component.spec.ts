import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
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

  beforeEach(async () => {
    markerService = {
      listDefinitions: vi.fn(),
      createDefinition: vi.fn(),
      updateDefinition: vi.fn(),
      deleteDefinition: vi.fn(),
      aggregateList: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    linkService = { getLink: vi.fn() };
    registry = { reconcileLink: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MarkerManagerComponent],
      providers: [
        { provide: MarkerService, useValue: markerService },
        { provide: LinkService, useValue: linkService },
        { provide: LinksDataSource, useValue: { get: vi.fn(), update: vi.fn(), getItems: vi.fn(() => []) } },
        { provide: MapLinksDataSource, useValue: { get: vi.fn(), update: vi.fn() } },
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
});
