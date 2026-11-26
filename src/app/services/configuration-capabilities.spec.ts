import { describe, expect, it } from 'vitest';
import { Node } from '../cartography/models/node';
import {
  canCaptureConfiguration,
  configurationExportDriver,
  isCaptureOnlyDriver,
  dockerIolRunner,
  exportReadsConsole,
  isDockerFrr,
  isDockerIol,
  nodeConfigCapabilities,
  startupBlocker,
  startupWarning,
  startupDeviceType,
  startupMediaProfileFitsDevice,
  startupMediaProfileId,
  wipeableNodes,
} from './configuration-capabilities';

const node = (overrides: Partial<Node>) => ({ node_id: 'n', status: 'stopped', properties: {}, ...overrides }) as Node;

/** A started QEMU node with the usual fixture fields; tests override what they exercise. */
const started = (overrides: Partial<Node> = {}) =>
  ({
    node_id: 'node-1',
    project_id: 'project-1',
    name: 'R1',
    node_type: 'qemu',
    status: 'started',
    properties: {},
    ...overrides,
  }) as Node;

describe('configurationExportDriver', () => {
  it.each([
    ['cisco_ios', 'cisco_ios_telnet'],
    ['cisco_xe', 'cisco_ios_telnet'],
    ['cisco_xe_ssh', 'cisco_ios_telnet'],
    ['cisco_xe_telnet', 'cisco_ios_telnet'],
    ['cisco_asa_ssh', 'cisco_asa'],
    ['cisco_asa_telnet', 'cisco_asa'],
    ['cisco_nxos_telnet', 'cisco_nxos'],
    ['mikrotik_routeros', 'mikrotik_routeros'],
    ['juniper_junos', 'juniper_junos'],
    ['juniper_junos_telnet', 'juniper_junos'],
    ['juniper_screenos', undefined],
    ['linux', undefined],
    [undefined, undefined],
  ])('%s -> %s', (value, expected) => {
    expect(configurationExportDriver(value)).toBe(expected);
  });
});

describe('GNS3_IOL_RUNNER parser', () => {
  it('reads the runner from any environment line, tolerating whitespace and CRLF-free values', () => {
    const docker = node({
      node_type: 'docker',
      properties: { environment: 'A=1\n  GNS3_IOL_RUNNER= iol.bin \nB=2' } as any,
    });
    expect(dockerIolRunner(docker)).toBe('iol.bin');
    expect(isDockerIol(docker)).toBe(true);
  });
});

describe('nodeConfigCapabilities', () => {
  it.each([
    // type, export, import, wipe
    ['vpcs', true, true, true],
    ['iou', true, true, true],
    ['dynamips', true, true, true],
    ['qemu', true, false, true],
    ['docker', true, false, true],
    ['cloud', false, false, false],
    ['ethernet_switch', false, false, false],
  ])('%s: supported=%s import=%s wipe=%s', (type, supported, canImport, canWipe) => {
    expect(nodeConfigCapabilities(node({ node_type: type }))).toMatchObject({
      supported,
      canImport,
      canWipe,
    });
  });

  it('offers wipe in every state of a supported node', () => {
    for (const status of ['started', 'stopped', 'suspended']) {
      expect(nodeConfigCapabilities(node({ node_type: 'qemu', status })).canWipe).toBe(true);
    }
  });

  it('can capture stopped VPCS/Docker-Linux but only started console devices with a driver', () => {
    expect(nodeConfigCapabilities(node({ node_type: 'vpcs', status: 'stopped' })).canCapture).toBe(true);
    expect(nodeConfigCapabilities(node({ node_type: 'docker', status: 'stopped' })).canCapture).toBe(true);
    expect(nodeConfigCapabilities(node({ node_type: 'iou', status: 'stopped' })).canCapture).toBe(false);
    expect(nodeConfigCapabilities(node({ node_type: 'iou', status: 'started' })).canCapture).toBe(true);
    expect(nodeConfigCapabilities(node({ node_type: 'qemu', status: 'started' })).canCapture).toBe(false);
    expect(
      nodeConfigCapabilities(node({ node_type: 'qemu', status: 'started', netmiko_device_type: 'cisco_asa' }))
        .canCapture,
    ).toBe(true);
  });
});

describe('QEMU startup configuration profile', () => {
  const qemu = (overrides: Partial<Node> = {}, profile?: string | null) =>
    node({ node_type: 'qemu', properties: { startup_media_profile: profile } as any, ...overrides });
  const entry = (device_type: string) => ({ device_type });

  describe('without a profile (console restore)', () => {
    it.each([
      [{}, undefined, 'device_type_required'],
      [{ netmiko_device_type: 'linux' }, undefined, 'device_type_unsupported'],
      [
        { netmiko_device_type: 'cisco_ios_telnet', console_type: 'vnc' },
        undefined,
        'configuration_restore_console_required',
      ],
      [{ netmiko_device_type: 'cisco_ios_telnet', console_type: 'telnet' }, undefined, undefined],
      [{ netmiko_device_type: 'cisco_ios_telnet' }, undefined, undefined],
      [
        { netmiko_device_type: 'cisco_ios_telnet', console_type: 'spice' },
        undefined,
        'configuration_restore_console_required',
      ],
      [
        { netmiko_device_type: 'cisco_ios_telnet', console_type: 'none' },
        undefined,
        'configuration_restore_console_required',
      ],
      [{ netmiko_device_type: 'cisco_asa_ssh' }, 'cisco_asa', undefined],
      [{ netmiko_device_type: 'cisco_ios_telnet', console_type: 'ssh' }, 'cisco_asa', 'configuration_profile_mismatch'],
    ])('%j entry=%s -> %s', (overrides, entryType, expected) => {
      expect(startupBlocker(qemu(overrides as any), entryType ? entry(entryType) : undefined)).toBe(expected);
    });
    it.each([null, ''])('treats the profile %j as none', (profile) => {
      expect(startupBlocker(qemu({}, profile))).toBe('device_type_required');
      expect(startupMediaProfileId(qemu({}, profile))).toBeUndefined();
    });
    it('refuses a Viptela device type and points at the profile', () => {
      const viptela = qemu({ netmiko_device_type: 'cisco_viptela', console_type: 'telnet' });
      expect(startupBlocker(viptela)).toBe('configuration_apply_unsupported');
      expect(startupBlocker(viptela, entry('cisco_viptela'))).toBe('configuration_apply_unsupported');
    });
    it('refuses a PAN-OS device type (capture only) and points at the profile', () => {
      const panos = qemu({ netmiko_device_type: 'paloalto_panos', console_type: 'telnet' });
      expect(startupBlocker(panos)).toBe('configuration_apply_unsupported');
      expect(startupBlocker(panos, entry('paloalto_panos'))).toBe('configuration_apply_unsupported');
      expect(configurationExportDriver('paloalto_panos_telnet')).toBe('paloalto_panos');
      expect(isCaptureOnlyDriver('paloalto_panos')).toBe(true);
      expect(isCaptureOnlyDriver('arista_eos')).toBe(true);
      expect(isCaptureOnlyDriver('juniper_junos')).toBe(true);
      expect(configurationExportDriver('juniper_junos_telnet')).toBe('juniper_junos');
      expect(configurationExportDriver('arista_eos_telnet')).toBe('arista_eos');
      expect(isCaptureOnlyDriver('cisco_ios_telnet')).toBe(false);
    });
    it('refuses a Viptela entry on a node whose console type is another recipe', () => {
      expect(startupBlocker(qemu({ netmiko_device_type: 'cisco_ios_telnet' }), entry('cisco_viptela'))).toBe(
        'configuration_profile_mismatch',
      );
    });
  });

  describe('with a profile (boot media)', () => {
    it.each([
      ['cisco-c8000v-autonomous', 'cisco_ios_telnet'],
      ['cisco-c8000v-controller', 'cisco_ios_telnet'],
      ['cisco-viptela', 'cisco_viptela'],
      ['paloalto-panos', 'paloalto_panos'],
      ['arista-veos', 'arista_eos'],
      ['juniper-vsrx', 'juniper_junos'],
    ])('%s needs neither a Netmiko type nor a console, and takes %s entries', (profile, deviceType) => {
      const bare = qemu({ console_type: 'vnc' }, profile);
      expect(startupBlocker(bare)).toBeUndefined();
      expect(startupBlocker(bare, entry(deviceType))).toBeUndefined();
      expect(startupDeviceType(bare)).toBe(deviceType);
    });
    it('blocks an entry of another device type with configuration_profile_mismatch', () => {
      expect(startupBlocker(qemu({}, 'cisco-viptela'), entry('cisco_ios_telnet'))).toBe(
        'configuration_profile_mismatch',
      );
      expect(startupBlocker(qemu({}, 'cisco-c8000v-controller'), entry('cisco_viptela'))).toBe(
        'configuration_profile_mismatch',
      );
    });
    it('allows Viptela with the profile even when the Netmiko type is Viptela', () => {
      expect(
        startupBlocker(qemu({ netmiko_device_type: 'cisco_viptela' }, 'cisco-viptela'), entry('cisco_viptela')),
      ).toBe(undefined);
    });
    it('does not block an unknown (newer) profile and keeps the console recipe for the entry type', () => {
      const future = qemu({ netmiko_device_type: 'cisco_asa' }, 'future-profile');
      expect(startupBlocker(future, entry('cisco_asa'))).toBeUndefined();
      expect(startupDeviceType(future)).toBe('cisco_asa');
    });
    it('does not apply to other node types', () => {
      const docker = node({ node_type: 'docker', properties: { startup_media_profile: 'cisco-viptela' } as any });
      expect(startupMediaProfileId(docker)).toBeUndefined();
    });
    it('keeps export and capture on the console requirements', () => {
      const started = (extra: Partial<Node>) => qemu({ status: 'started', ...extra }, 'cisco-viptela');
      expect(nodeConfigCapabilities(started({})).canCapture).toBe(false);
      expect(nodeConfigCapabilities(started({ netmiko_device_type: 'cisco_viptela' })).canCapture).toBe(true);
      expect(nodeConfigCapabilities(started({})).supported).toBe(true);
    });
    it('offers wipe and uses the profile device type', () => {
      expect(startupDeviceType(qemu({}, 'cisco-viptela'))).toBe('cisco_viptela');
      expect(nodeConfigCapabilities(qemu({}, 'cisco-viptela')).canWipe).toBe(true);
    });
  });
});

describe('startupMediaProfileFitsDevice', () => {
  it.each([
    ['cisco_ios_telnet', 'cisco_xe', true],
    ['cisco_ios_telnet', 'cisco_ios', true],
    ['cisco_viptela', 'cisco_viptela', true],
    ['cisco_viptela', 'cisco_xe', false],
    ['cisco_ios_telnet', 'cisco_viptela', false],
    ['cisco_viptela', '', true],
    ['cisco_viptela', null, true],
    ['cisco_viptela', 'linux', false],
  ])('profile of %s on a node of type %s: %s', (profile, netmiko, fits) => {
    expect(startupMediaProfileFitsDevice(profile, netmiko)).toBe(fits);
  });
});

describe('bulk filters', () => {
  const nodes = [
    node({ node_id: 'a', node_type: 'vpcs', status: 'stopped' }),
    node({ node_id: 'b', node_type: 'iou', status: 'stopped' }),
    node({ node_id: 'c', node_type: 'iou', status: 'started' }),
    node({ node_id: 'd', node_type: 'cloud', status: 'started' }),
  ];
  it('wipeableNodes keeps every supported node regardless of state', () => {
    expect(wipeableNodes(nodes).map((n) => n.node_id)).toEqual(['a', 'b', 'c']);
  });
  it('distinguishes nodes that need to start from unsupported nodes and readable saved files', () => {
    const candidates = [
      ...nodes,
      node({ node_type: 'qemu', status: 'stopped' }),
      node({ node_type: 'qemu', status: 'suspended', netmiko_device_type: 'cisco_ios' }),
      node({ node_type: 'docker', status: 'stopped' }),
    ];
    expect(
      candidates.map((candidate) => {
        const { canCapture, captureRequiresStart } = nodeConfigCapabilities(candidate);
        return [canCapture, captureRequiresStart];
      }),
    ).toEqual([
      [true, false],
      [false, true],
      [true, false],
      [false, false],
      [false, false],
      [false, true],
      [true, false],
    ]);
  });
});

describe('startupDeviceType', () => {
  it.each([
    [{ node_type: 'iou' }, 'cisco_ios_telnet'],
    [{ node_type: 'dynamips' }, 'cisco_ios_telnet'],
    [{ node_type: 'vpcs' }, 'vpcs'],
    [{ node_type: 'qemu', netmiko_device_type: 'cisco_nxos_telnet' }, 'cisco_nxos'],
    [{ node_type: 'qemu', netmiko_device_type: 'cisco_xe_ssh' }, 'cisco_ios_telnet'],
    [{ node_type: 'qemu', netmiko_device_type: 'cisco_asa_ssh' }, 'cisco_asa'],
    [{ node_type: 'qemu', netmiko_device_type: 'linux' }, undefined],
    [{ node_type: 'qemu' }, undefined],
    [{ node_type: 'docker' }, 'linux_interfaces'],
    [{ node_type: 'docker', properties: { environment: 'A=1\nGNS3_IOL_RUNNER=iol.bin' } }, 'cisco_ios_telnet'],
  ])('%j -> %s', (overrides, expected) => {
    expect(startupDeviceType(started(overrides as Partial<Node>))).toBe(expected);
  });
});

describe('canCaptureConfiguration', () => {
  it('lets VPCS and Docker-Linux be read in any state, and console devices only while started', () => {
    expect(canCaptureConfiguration(started({ status: 'stopped' }), 'vpcs')).toBe(true);
    expect(canCaptureConfiguration(started({ status: 'stopped' }), 'linux_interfaces')).toBe(true);
    expect(canCaptureConfiguration(started({ status: 'stopped' }), 'cisco_asa')).toBe(false);
    expect(canCaptureConfiguration(started({ status: 'started', netmiko_device_type: 'cisco_asa' }), 'cisco_asa')).toBe(
      true,
    );
    // Reading the running console needs the node's own Netmiko recipe, even when startup is delivered as boot media.
    expect(canCaptureConfiguration(started({ status: 'started' }), 'cisco_asa')).toBe(false);
    expect(canCaptureConfiguration(undefined, 'cisco_asa')).toBe(false);
  });
});

describe('startupBlocker for native engines and Docker', () => {
  it('does not block native engines', () => {
    for (const node_type of ['dynamips', 'iou', 'vpcs']) expect(startupBlocker(started({ node_type }))).toBeUndefined();
  });
  it('blocks Docker nodes the server cannot wipe, but not the network file or IOL', () => {
    const docker = (overrides: Partial<Node> = {}) => started({ node_type: 'docker', ...overrides });
    expect(startupBlocker(docker())).toBeUndefined();
    expect(startupBlocker(docker({ netmiko_device_type: 'linux_telnet' }))).toBeUndefined();
    expect(startupBlocker(docker({ netmiko_device_type: 'cisco_ios' }))).toBe('configuration_wipe_unsupported');
    expect(
      startupBlocker(
        docker({ netmiko_device_type: 'cisco_ios', properties: { environment: 'GNS3_IOL_RUNNER=x' } as any }),
      ),
    ).toBeUndefined();
  });
  it('keeps unsupported Docker nodes out of wipe and startup but still exportable', () => {
    const frr = nodeConfigCapabilities(started({ node_type: 'docker', netmiko_device_type: 'frr' }));
    expect(frr).toMatchObject({ supported: true, canWipe: false });
    expect(nodeConfigCapabilities(started({ node_type: 'docker' }))).toMatchObject({ canWipe: true });
  });
});

describe('exportReadsConsole', () => {
  it.each([
    ['qemu', 'stopped', true],
    ['iou', 'started', false],
    ['dynamips', 'started', false],
    ['vpcs', 'started', false],
    ['docker', 'started', false],
  ])('%s node that is %s: %s', (node_type, status, reads) => {
    expect(exportReadsConsole({ node_type, status } as Node)).toBe(reads);
  });

  it('counts a running FRR container, which is read with a command inside it', () => {
    const frr = (status: string) => ({ node_type: 'docker', status, properties: { image: 'gns3/frr' } }) as any;
    expect(exportReadsConsole(frr('started'))).toBe(true);
    expect(exportReadsConsole(frr('stopped'))).toBe(false);
  });
});

describe('startupWarning', () => {
  it('warns about a Junos configuration without a root password only', () => {
    const entry = (content: string) => ({ device_type: 'juniper_junos', content });
    expect(startupWarning(entry('system {\n host-name a;\n}'))).toContain('no root password');
    expect(startupWarning(entry('system {\n root-authentication {\n }\n}'))).toBe('');
    expect(startupWarning(entry('  '))).toBe('');
    expect(startupWarning({ device_type: 'cisco_nxos', content: 'hostname a' })).toBe('');
  });
});

describe('FRR containers', () => {
  const frr = (properties: any, extra: Partial<Node> = {}) =>
    ({ node_type: 'docker', console_type: 'telnet', status: 'stopped', properties, ...extra }) as Node;

  it.each([
    ['gns3/frr:latest', '', true],
    ['quay.io/frrouting/frr:10.4.5', '', true],
    ['my-router:1', 'FRR_PROFILE=lite,', true],
    ['alpine:latest', 'TERM=xterm', false],
    ['frrouting/frr-exporter:1', '', false],
  ])('recognizes %s', (image, environment, expected) => {
    expect(isDockerFrr(frr({ image, environment }))).toBe(expected);
  });

  it('uses the FRR file, also while stopped, unless a device type or a vendor console says otherwise', () => {
    const node = frr({ image: 'gns3/frr:latest' });
    expect(startupDeviceType(node)).toBe('frr');
    expect(nodeConfigCapabilities(node)).toMatchObject({ canCapture: true, canWipe: true });
    expect(startupDeviceType(frr({ image: 'gns3/frr' }, { netmiko_device_type: 'linux' }))).toBe('linux_interfaces');
    expect(isDockerFrr(frr({ image: 'gns3/frr' }, { console_type: 'docker_exec' }))).toBe(false);
  });
});
