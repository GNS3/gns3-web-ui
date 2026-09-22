import { describe, expect, it } from 'vitest';
import { linkSignatures, nodeSignatures } from './item-signature';

describe('linkSignatures', () => {
  it('detects runtime interface status changes as visual changes', () => {
    const link = {
      link_id: 'link-1',
      nodes: [],
      capturing: false,
      suspend: false,
      show_filters_icon: true,
      wireshark: false,
      link_type: 'ethernet',
      interface_statuses: ['started'],
    };
    const before = linkSignatures(link);

    link.interface_statuses = ['stopped'];
    const after = linkSignatures(link);

    expect(after.groups.visual).not.toBe(before.groups.visual);
  });
});

describe('nodeSignatures', () => {
  const createNode = (missingImage = false, missingImages: unknown[] = []) => ({
    node_id: 'node-1',
    x: 0,
    y: 0,
    z: 1,
    symbol: ':/symbols/router.svg',
    symbol_url: 'blob:1',
    width: 60,
    height: 60,
    status: 'stopped',
    locked: false,
    name: 'R1',
    node_type: 'qemu',
    first_port_name: '',
    port_name_format: 'Ethernet{0}',
    port_segment_size: 0,
    label: {},
    ports: [],
    missing_image: missingImage,
    missing_images: missingImages,
  });

  it('treats a change of the missing image state as a visual change', () => {
    const before = nodeSignatures(createNode(false));
    const after = nodeSignatures(createNode(true));

    expect(after.groups.visual).not.toBe(before.groups.visual);
  });

  it('treats a change of the missing image details as a visual change', () => {
    const before = nodeSignatures(createNode(true, [{ image: 'old.qcow2' }]));
    const after = nodeSignatures(createNode(true, [{ image: 'new.qcow2' }]));

    expect(after.groups.visual).not.toBe(before.groups.visual);
  });
});
