import { describe, it, expect } from 'vitest';
import { computeDefaultPortName, evaluatePortNameFormat } from './port-name-format';

describe('computeDefaultPortName', () => {
  it('should default to Ethernet{0} when no format is given', () => {
    expect(computeDefaultPortName(0, {})).toBe('Ethernet0');
    expect(computeDefaultPortName(3, {})).toBe('Ethernet3');
  });

  it('should substitute the interface number into {0}', () => {
    expect(computeDefaultPortName(2, { portNameFormat: 'eth{0}' })).toBe('eth2');
  });

  it('should keep interface and segment numbers equal without segment size', () => {
    expect(computeDefaultPortName(2, { portNameFormat: 'Gi{1}/{0}' })).toBe('Gi2/2');
  });

  it('should wrap the interface number at the segment size (server semantics)', () => {
    const context = { portNameFormat: 'Ethernet{segment0}/{port0}', portSegmentSize: 4 };

    expect(computeDefaultPortName(0, context)).toBe('Ethernet0/0');
    expect(computeDefaultPortName(3, context)).toBe('Ethernet0/3');
    expect(computeDefaultPortName(4, context)).toBe('Ethernet1/0');
    expect(computeDefaultPortName(7, context)).toBe('Ethernet1/3');
  });

  it('should repeat interface numbers per segment with {0} only', () => {
    const context = { portNameFormat: 'eth{0}', portSegmentSize: 2 };

    expect(computeDefaultPortName(0, context)).toBe('eth0');
    expect(computeDefaultPortName(1, context)).toBe('eth1');
    expect(computeDefaultPortName(2, context)).toBe('eth0');
    expect(computeDefaultPortName(3, context)).toBe('eth1');
  });

  it('should use first_port_name literally for adapter 0 without consuming a number', () => {
    const context = { portNameFormat: 'Ethernet{0}', firstPortName: 'MgmtEth0' };

    expect(computeDefaultPortName(0, context)).toBe('MgmtEth0');
    expect(computeDefaultPortName(1, context)).toBe('Ethernet0');
    expect(computeDefaultPortName(2, context)).toBe('Ethernet1');
  });

  it('should keep the real adapter number for {adapter} when first_port_name shifts numbering', () => {
    const context = { portNameFormat: 'eth{adapter}', firstPortName: 'mgmt' };

    expect(computeDefaultPortName(1, context)).toBe('eth1');
  });

  it('should evaluate appliance-style formats', () => {
    expect(computeDefaultPortName(0, { portNameFormat: 'ens{port4}' })).toBe('ens4');
    expect(computeDefaultPortName(5, { portNameFormat: 'ge-0/0/{0}' })).toBe('ge-0/0/5');
  });
});

describe('evaluatePortNameFormat', () => {
  it('should replace every supported placeholder', () => {
    expect(evaluatePortNameFormat('{0}-{1}-{adapter}-{port2}-{segment3}', 5, 7, 9)).toBe('5-7-9-7-10');
  });

  it('should replace repeated placeholders', () => {
    expect(evaluatePortNameFormat('{0}/{0}', 3, 1, 2)).toBe('3/3');
  });

  it('should leave unsupported tokens untouched', () => {
    expect(evaluatePortNameFormat('eth{port9}', 0, 0, 0)).toBe('eth{port9}');
  });
});
