import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfigActionComponent } from './config-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ConfiguratorDialogVpcsComponent } from '../../../node-editors/configurator/vpcs/configurator-vpcs.component';
import { ConfiguratorDialogEthernetHubComponent } from '../../../node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component';
import { ConfiguratorDialogEthernetSwitchComponent } from '../../../node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component';
import { ConfiguratorDialogCloudComponent } from '../../../node-editors/configurator/cloud/configurator-cloud.component';
import { ConfiguratorDialogIosComponent } from '../../../node-editors/configurator/ios/configurator-ios.component';
import { ConfiguratorDialogIouComponent } from '../../../node-editors/configurator/iou/configurator-iou.component';
import { ConfiguratorDialogQemuComponent } from '../../../node-editors/configurator/qemu/configurator-qemu.component';
import { ConfiguratorDialogVirtualBoxComponent } from '../../../node-editors/configurator/virtualbox/configurator-virtualbox.component';
import { ConfiguratorDialogVmwareComponent } from '../../../node-editors/configurator/vmware/configurator-vmware.component';
import { ConfiguratorDialogDockerComponent } from '../../../node-editors/configurator/docker/configurator-docker.component';
import { ConfiguratorDialogNatComponent } from '../../../node-editors/configurator/nat/configurator-nat.component';
import { ConfiguratorDialogSwitchComponent } from '../../../node-editors/configurator/switch/configurator-switch.component';
import { ConfiguratorDialogAtmSwitchComponent } from '../../../node-editors/configurator/atm_switch/configurator-atm-switch.component';

describe('ConfigActionComponent', () => {
  let fixture: ComponentFixture<ConfigActionComponent>;
  let component: ConfigActionComponent;
  let mockDialog: MatDialog;
  let mockDialogRef: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    authToken: 'token',
    location: 'local',
    host: 'localhost',
    port: 8080,
    path: '/',
    ubridge_path: '/usr/local/bin/ubridge',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
    status: 'stopped',
  };

  const createMockNode = (nodeType: string, overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      name: 'Test Node',
      node_type: nodeType,
      locked: false,
      ...overrides,
    } as Node);

  const baseDialogConfig = {
    panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
    autoFocus: false,
    disableClose: false,
  };

  beforeEach(async () => {
    mockDialogRef = {
      componentInstance: {
        controller: undefined,
        node: undefined,
      },
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ConfigActionComponent, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('configureNode()', () => {
    it('should open VPCS configurator for vpcs node type', () => {
      const node = createMockNode('vpcs');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogVpcsComponent, baseDialogConfig);
    });

    it('should open ethernet hub configurator for ethernet_hub node type', () => {
      const node = createMockNode('ethernet_hub');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogEthernetHubComponent, baseDialogConfig);
    });

    it('should open ethernet switch configurator for ethernet_switch node type', () => {
      const node = createMockNode('ethernet_switch');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogEthernetSwitchComponent, baseDialogConfig);
    });

    it('should open cloud configurator for cloud node type', () => {
      const node = createMockNode('cloud');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogCloudComponent, baseDialogConfig);
    });

    it('should open IOS configurator for dynamips node type', () => {
      const node = createMockNode('dynamips');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogIosComponent, baseDialogConfig);
    });

    it('should open IOU configurator for iou node type', () => {
      const node = createMockNode('iou');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogIouComponent, baseDialogConfig);
    });

    it('should open QEMU configurator for qemu node type with correct panel class', () => {
      const node = createMockNode('qemu');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogQemuComponent, {
        ...baseDialogConfig,
        panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
      });
    });

    it('should open VirtualBox configurator for virtualbox node type', () => {
      const node = createMockNode('virtualbox');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogVirtualBoxComponent, baseDialogConfig);
    });

    it('should open VMware configurator for vmware node type', () => {
      const node = createMockNode('vmware');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogVmwareComponent, baseDialogConfig);
    });

    it('should open Docker configurator for docker node type', () => {
      const node = createMockNode('docker');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogDockerComponent, baseDialogConfig);
    });

    it('should open NAT configurator for nat node type', () => {
      const node = createMockNode('nat');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogNatComponent, baseDialogConfig);
    });

    it('should open frame relay switch configurator for frame_relay_switch node type', () => {
      const node = createMockNode('frame_relay_switch');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogSwitchComponent, baseDialogConfig);
    });

    it('should open ATM switch configurator for atm_switch node type', () => {
      const node = createMockNode('atm_switch');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfiguratorDialogAtmSwitchComponent, baseDialogConfig);
    });

    it('should set controller on dialog component instance', () => {
      const node = createMockNode('vpcs');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialogRef.componentInstance.controller).toBe(mockController);
    });

    it('should set node on dialog component instance', () => {
      const node = createMockNode('vpcs');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);

      component.configureNode();

      expect(mockDialogRef.componentInstance.node).toBe(node);
    });
  });

  describe('template', () => {
    it('should call configureNode when button is clicked', () => {
      const node = createMockNode('vpcs');
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      const configureNodeSpy = vi.spyOn(component, 'configureNode');

      button.click();

      expect(configureNodeSpy).toHaveBeenCalled();
    });
  });
});
