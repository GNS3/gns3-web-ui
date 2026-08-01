import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { ToasterService } from '@services/toaster.service';
import { CloudValidationService } from '@services/validation';
import { CloudNodesTemplateDetailsComponent } from './cloud-nodes-template-details.component';

describe('CloudNodesTemplateDetailsComponent', () => {
  let component: CloudNodesTemplateDetailsComponent;
  let fixture: ComponentFixture<CloudNodesTemplateDetailsComponent>;
  let computeService: { getNetworkInterfaces: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const controller = { id: 1 };
    const template = {
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      default_name_format: 'Cloud{0}',
      name: 'Cloud',
      ports_mapping: [
        { interface: 'eth0', name: 'eth0', port_number: 0, type: 'ethernet' },
        { interface: 'tap0', name: 'tap0', port_number: 1, type: 'tap' },
      ],
      remote_console_host: '127.0.0.1',
      remote_console_http_path: '/',
      remote_console_port: 23,
      remote_console_type: 'none',
      symbol: 'cloud',
      template_id: 'template-1',
      template_type: 'cloud',
      usage: '',
    };
    computeService = {
      getNetworkInterfaces: vi.fn().mockReturnValue(
        of([
          { name: 'eth0', special: false, type: 'ethernet' },
          { name: 'eth1', special: false, type: 'ethernet' },
          { name: 'tap0', special: false, type: 'tap' },
        ])
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CloudNodesTemplateDetailsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'controller_id' ? '1' : 'template-1'),
              },
            },
          },
        },
        { provide: ControllerService, useValue: { get: vi.fn().mockResolvedValue(controller) } },
        { provide: BuiltInTemplatesService, useValue: { getTemplate: vi.fn().mockReturnValue(of(template)) } },
        { provide: ComputeService, useValue: computeService },
        {
          provide: BuiltInTemplatesConfigurationService,
          useValue: {
            getCategoriesForCloudNodes: vi.fn().mockReturnValue([]),
            getConsoleTypesForCloudNodes: vi.fn().mockReturnValue(['none']),
          },
        },
        {
          provide: CloudValidationService,
          useValue: {
            validateInterfaceName: vi.fn().mockReturnValue({ isValid: true }),
            validateUniqueInterface: vi.fn().mockReturnValue({ isValid: true }),
          },
        },
        { provide: ToasterService, useValue: { error: vi.fn(), warning: vi.fn(), success: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: DialogConfigService, useValue: { openConfig: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudNodesTemplateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads and separates Ethernet and TAP interfaces for the template compute', () => {
    expect(computeService.getNetworkInterfaces).toHaveBeenCalledWith(component.controller, 'local');
    expect(component.availableEthernetInterfaces().map((networkInterface) => networkInterface.name)).toEqual([
      'eth0',
      'eth1',
    ]);
    expect(component.availableTapInterfaces().map((networkInterface) => networkInterface.name)).toEqual(['tap0']);
  });

  it('keeps the saved Ethernet and TAP mappings visible', () => {
    expect(component.portsMappingEthernet.map((mapping) => mapping.name)).toEqual(['eth0']);
    expect(component.portsMappingTap.map((mapping) => mapping.name)).toEqual(['tap0']);
  });
});
