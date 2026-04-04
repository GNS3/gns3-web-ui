import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { NodesDataSource } from '../../../../cartography/datasources/nodes-datasource';
import { LinkService } from '@services/link.service';
import { PacketCaptureService } from '@services/packet-capture.service';
import { ToasterService } from '@services/toaster.service';
import { StartCaptureDialogComponent } from './start-capture.component';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { Node } from '../../../../cartography/models/node';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StartCaptureDialogComponent', () => {
  let fixture: ComponentFixture<StartCaptureDialogComponent>;
  let mockDialogRef: any;
  let mockLinkService: any;
  let mockPacketCaptureService: any;
  let mockToasterService: any;
  let mockNodesDataSource: any;
  let mockController: Controller;
  let mockProject: Project;

  const createMockController = (): Controller =>
    ({
      id: 1,
      authToken: 'token',
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller);

  const createMockProject = (): Project =>
    ({
      project_id: 'proj-123',
      name: 'Test Project',
      filename: 'test.gns3',
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_layers: false,
      snap_to_grid: false,
      show_grid: false,
      grid_size: 75,
      drawing_grid_size: 25,
      show_interface_labels: false,
      variables: [],
      path: '/path/to/project',
      readonly: false,
    } as Project);

  const createMockNode = (name: string, ports: any[]): Node =>
    ({
      name,
      ports,
      status: 'started',
      node_id: `node-${name}`,
    } as unknown as Node);

  const createMockLinkNode = (nodeId: string, portNumber: number): LinkNode =>
    ({
      node_id: nodeId,
      adapter_number: 0,
      port_number: portNumber,
      label: { text: '' },
    } as LinkNode);

  const createMockLink = (linkType: string, linkNodes: LinkNode[]): Link =>
    ({
      link_id: 'link-1',
      link_type: linkType,
      nodes: linkNodes,
      project_id: 'proj-123',
      capture_file_name: '',
      capture_file_path: '',
      capturing: false,
      suspend: false,
      distance: 0,
      length: 0,
      source: null as unknown as Node,
      target: null as unknown as Node,
      x: 0,
      y: 0,
    } as Link);

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockLinkService = {
      startCaptureOnLink: vi.fn().mockReturnValue(of(undefined)),
    };

    mockPacketCaptureService = {
      startCapture: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockController = createMockController();
    mockProject = createMockProject();

    // Create default mock data to prevent ngOnInit crash during createComponent
    const defaultLink = createMockLink('ethernet', [
      createMockLinkNode('node-DefaultSrc', 0),
      createMockLinkNode('node-DefaultDst', 0),
    ]);
    const defaultSrcNode = createMockNode('DefaultSrc', [{ name: 'Eth0/0' }]);
    const defaultDstNode = createMockNode('DefaultDst', [{ name: 'Eth0/0' }]);

    mockNodesDataSource = {
      get: vi.fn().mockReturnValueOnce(defaultSrcNode).mockReturnValueOnce(defaultDstNode),
    };

    await TestBed.configureTestingModule({
      imports: [
        StartCaptureDialogComponent,
        ReactiveFormsModule,
        MatSelectModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: LinkService, useValue: mockLinkService },
        { provide: PacketCaptureService, useValue: mockPacketCaptureService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StartCaptureDialogComponent);
    fixture.componentInstance.controller = mockController;
    fixture.componentInstance.project = mockProject;
    fixture.componentInstance.link = defaultLink;
  });

  afterEach(() => {
    fixture.destroy();
  });

  const setupWithEthernetLink = () => {
    const sourceNode = createMockNode('Router1', [{ name: 'Eth0/0' }, { name: 'Eth0/1' }]);
    const targetNode = createMockNode('Router2', [{ name: 'Eth0/0' }, { name: 'Eth0/1' }]);
    const linkNodes = [createMockLinkNode('node-Router1', 0), createMockLinkNode('node-Router2', 0)];
    const link = createMockLink('ethernet', linkNodes);

    // Use mockReturnValue to return proper nodes for each call
    mockNodesDataSource.get
      .mockReturnValueOnce(sourceNode)
      .mockReturnValueOnce(targetNode)
      .mockReturnValueOnce(sourceNode)
      .mockReturnValueOnce(targetNode);

    fixture.componentInstance.link = link;
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    return { sourceNode, targetNode, link };
  };

  const setupWithNonEthernetLink = () => {
    const sourceNode = createMockNode('Router1', [{ name: 'Serial0/0' }, { name: 'Serial0/1' }]);
    const targetNode = createMockNode('Router2', [{ name: 'Serial0/0' }, { name: 'Serial0/1' }]);
    const linkNodes = [createMockLinkNode('node-Router1', 0), createMockLinkNode('node-Router2', 0)];
    const link = createMockLink('hdlc', linkNodes);

    mockNodesDataSource.get
      .mockReturnValueOnce(sourceNode)
      .mockReturnValueOnce(targetNode)
      .mockReturnValueOnce(sourceNode)
      .mockReturnValueOnce(targetNode);

    fixture.componentInstance.link = link;
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    return { sourceNode, targetNode, link };
  };

  const setupWithStoppedNodes = () => {
    const sourceNode = createMockNode('Router1', [{ name: 'Eth0/0' }]);
    const targetNode = createMockNode('Router2', [{ name: 'Eth0/0' }]);
    sourceNode.status = 'stopped';
    targetNode.status = 'stopped';
    const linkNodes = [createMockLinkNode('node-Router1', 0), createMockLinkNode('node-Router2', 0)];
    const link = createMockLink('ethernet', linkNodes);

    mockNodesDataSource.get
      .mockReturnValueOnce(sourceNode)
      .mockReturnValueOnce(targetNode)
      .mockReturnValueOnce(sourceNode)
      .mockReturnValueOnce(targetNode);

    fixture.componentInstance.link = link;
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    return { sourceNode, targetNode, link };
  };

  describe('Creation', () => {
    it('should create the component', () => {
      setupWithEthernetLink();
      expect(fixture.componentInstance).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should set ethernet linkTypes for ethernet link', () => {
      setupWithEthernetLink();
      expect(fixture.componentInstance.linkTypes).toEqual([['Ethernet', 'DLT_EN10MB']]);
    });

    it('should set multiple linkTypes for non-ethernet link', () => {
      setupWithNonEthernetLink();
      expect(fixture.componentInstance.linkTypes).toEqual([
        ['Cisco HDLC', 'DLT_C_HDLC'],
        ['Cisco PPP', 'DLT_PPP_SERIAL'],
        ['Frame Relay', 'DLT_FRELAY'],
        ['ATM', 'DLT_ATM_RFC1483'],
      ]);
    });

    it('should generate filename from source and target node/port names', () => {
      setupWithEthernetLink();
      const fileNameControl = fixture.componentInstance.inputForm.get('fileName');
      // The regex removes non-alphanumeric chars except _ and -, so Eth0/0 becomes Eth00
      expect(fileNameControl?.value).toBe('Router1_Eth00_to_Router2_Eth00');
    });

    it('should set linkType to required field', () => {
      setupWithEthernetLink();
      const linkTypeControl = fixture.componentInstance.inputForm.get('linkType');
      expect(linkTypeControl?.hasError('required')).toBe(true);
    });
  });

  describe('onNoClick', () => {
    it('should close the dialog', () => {
      setupWithEthernetLink();
      fixture.componentInstance.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onYesClick', () => {
    it('should close the dialog when form is valid and devices are running', () => {
      const { link } = setupWithEthernetLink();
      fixture.componentInstance.inputForm.setValue({
        linkType: 'DLT_EN10MB',
        fileName: 'test_capture',
      });
      fixture.componentInstance.startProgram = false;

      fixture.componentInstance.onYesClick();

      expect(mockLinkService.startCaptureOnLink).toHaveBeenCalledWith(mockController, link, {
        capture_file_name: 'test_capture',
        data_link_type: 'DLT_EN10MB',
      });
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error toast when no devices are running', () => {
      setupWithStoppedNodes();
      fixture.componentInstance.inputForm.setValue({
        linkType: 'DLT_EN10MB',
        fileName: 'test_capture',
      });

      fixture.componentInstance.onYesClick();

      expect(mockToasterService.error).toHaveBeenCalledWith(
        'Cannot capture because there is no running device on this link'
      );
      expect(mockLinkService.startCaptureOnLink).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show error toast when form is invalid', () => {
      setupWithEthernetLink();
      fixture.componentInstance.inputForm.setValue({
        linkType: '',
        fileName: '',
      });

      fixture.componentInstance.onYesClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
      expect(mockLinkService.startCaptureOnLink).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should call packetCaptureService.startCapture when startProgram is true', () => {
      const { link } = setupWithEthernetLink();
      fixture.componentInstance.inputForm.setValue({
        linkType: 'DLT_EN10MB',
        fileName: 'test_capture',
      });
      fixture.componentInstance.startProgram = true;

      fixture.componentInstance.onYesClick();

      expect(mockPacketCaptureService.startCapture).toHaveBeenCalledWith(
        mockController,
        mockProject,
        link,
        'test_capture'
      );
    });

    it('should not call packetCaptureService.startCapture when startProgram is false', () => {
      setupWithEthernetLink();
      fixture.componentInstance.inputForm.setValue({
        linkType: 'DLT_EN10MB',
        fileName: 'test_capture',
      });
      fixture.componentInstance.startProgram = false;

      fixture.componentInstance.onYesClick();

      expect(mockPacketCaptureService.startCapture).not.toHaveBeenCalled();
    });
  });
});
