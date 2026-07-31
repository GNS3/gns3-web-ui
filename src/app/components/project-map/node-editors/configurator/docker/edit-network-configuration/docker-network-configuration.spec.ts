import { describe, expect, it } from 'vitest';
import { parseDockerNetworkConfiguration, serializeDockerNetworkConfiguration } from './docker-network-configuration';

describe('Docker network configuration parser', () => {
  it('creates disabled entries for every Docker adapter when the server returns its commented sample', () => {
    const configuration = `#
# This is a sample network config
#

#auto eth0
#iface eth0 inet dhcp
`;

    const parsed = parseDockerNetworkConfiguration(configuration, 2);

    expect(parsed.interfaces.map(({ name, enabled }) => ({ name, enabled }))).toEqual([
      { name: 'eth0', enabled: false },
      { name: 'eth1', enabled: false },
    ]);
    expect(parsed.preservedConfiguration).toContain('# This is a sample network config');
    expect(parsed.preservedConfiguration).not.toContain('#auto eth0');
    expect(parsed.preservedConfiguration).not.toContain('#iface eth0');
  });

  it('removes the managed commented template when an interface is configured', () => {
    const configuration = `# Keep this comment
# Static config for eth0
#auto eth0
#iface eth0 inet static
#\taddress 192.168.0.2
#\tnetmask 255.255.255.0
#\tgateway 192.168.0.1
#\tup echo nameserver 192.168.0.1 > /etc/resolv.conf
`;

    const parsed = parseDockerNetworkConfiguration(configuration, 1);
    parsed.interfaces[0] = {
      ...parsed.interfaces[0],
      enabled: true,
      ipv4Mode: 'static',
      ipv4Address: '192.168.10.2',
      netmask: '255.255.255.0',
      ipv4Gateway: '192.168.10.1',
    };
    const serialized = serializeDockerNetworkConfiguration(parsed.preservedConfiguration, parsed.interfaces);

    expect(serialized).toContain('# Keep this comment');
    expect(serialized).not.toContain('# Static config for eth0');
    expect(serialized).not.toContain('#auto eth0');
    expect(serialized.match(/iface eth0 inet static/g)).toHaveLength(1);
  });

  it('parses static IPv4, IPv6, DHCP, startup mode, DNS, MTU, and unsupported directives', () => {
    const configuration = `auto lo eth0
iface lo inet loopback

iface eth0 inet static
\taddress 192.168.10.2
\tnetmask 255.255.255.0
\tgateway 192.168.10.1
\tdns-nameservers 1.1.1.1 8.8.8.8
\tmtu 1450
\tup ip route add 10.0.0.0/8 via 192.168.10.1

iface eth0 inet6 static
\taddress 2001:db8::2/64
\tgateway 2001:db8::1

allow-hotplug eth1
iface eth1 inet dhcp
\thostname lab-node
`;

    const parsed = parseDockerNetworkConfiguration(configuration, 2);
    const [eth0, eth1] = parsed.interfaces;

    expect(eth0).toMatchObject({
      enabled: true,
      startupKeyword: 'auto',
      ipv4Mode: 'static',
      ipv4Address: '192.168.10.2',
      netmask: '255.255.255.0',
      ipv4Gateway: '192.168.10.1',
      dnsNameservers: '1.1.1.1 8.8.8.8',
      mtu: '1450',
      ipv6Mode: 'static',
      ipv6Address: '2001:db8::2',
      prefixLength: '64',
      ipv6Gateway: '2001:db8::1',
    });
    expect(eth0.ipv4ExtraDirectives).toContain('\tup ip route add 10.0.0.0/8 via 192.168.10.1');
    expect(eth1).toMatchObject({
      enabled: true,
      startupKeyword: 'allow-hotplug',
      ipv4Mode: 'dhcp',
      hostname: 'lab-node',
    });
    expect(parsed.preservedConfiguration).toContain('auto lo');
    expect(parsed.preservedConfiguration).toContain('iface lo inet loopback');
  });

  it('retains configured eth interfaces beyond the current adapter count', () => {
    const parsed = parseDockerNetworkConfiguration('auto eth3\niface eth3 inet dhcp\n', 1);

    expect(parsed.interfaces.map((networkInterface) => networkInterface.name)).toEqual(['eth0', 'eth3']);
    expect(parsed.interfaces[1].enabled).toBe(true);
  });
});

describe('Docker network configuration serializer', () => {
  it('writes the supported ifupdown directives and preserves unrelated configuration', () => {
    const parsed = parseDockerNetworkConfiguration(
      'source /etc/network/interfaces.d/*\nauto eth0\niface eth0 inet dhcp\n',
      1
    );
    parsed.interfaces[0] = {
      ...parsed.interfaces[0],
      ipv4Mode: 'static',
      ipv4Address: '172.16.0.2',
      netmask: '255.255.255.0',
      ipv4Gateway: '172.16.0.1',
      hostname: 'static-node',
      dnsNameservers: '9.9.9.9',
      mtu: '1500',
      ipv6Mode: 'static',
      ipv6Address: '2001:db8:1::2',
      prefixLength: '64',
      ipv6Gateway: '2001:db8:1::1',
    };

    const serialized = serializeDockerNetworkConfiguration(parsed.preservedConfiguration, parsed.interfaces);

    expect(serialized).toContain('source /etc/network/interfaces.d/*');
    expect(serialized).toContain('auto eth0');
    expect(serialized).toContain('iface eth0 inet static');
    expect(serialized).toContain('\taddress 172.16.0.2');
    expect(serialized).toContain('\tnetmask 255.255.255.0');
    expect(serialized).toContain('\tgateway 172.16.0.1');
    expect(serialized).toContain('\thostname static-node');
    expect(serialized).toContain('\tdns-nameservers 9.9.9.9');
    expect(serialized).toContain('\tmtu 1500');
    expect(serialized).toContain('iface eth0 inet6 static');
    expect(serialized).toContain('\taddress 2001:db8:1::2/64');
    expect(serialized).toContain('\tgateway 2001:db8:1::1');
  });

  it('removes active stanzas for disabled interfaces without losing preserved comments', () => {
    const parsed = parseDockerNetworkConfiguration('# Keep this comment\nauto eth0\niface eth0 inet dhcp\n', 1);
    parsed.interfaces[0] = { ...parsed.interfaces[0], enabled: false };

    const serialized = serializeDockerNetworkConfiguration(parsed.preservedConfiguration, parsed.interfaces);

    expect(serialized).toBe('# Keep this comment\n');
    expect(serialized).not.toContain('auto eth0');
    expect(serialized).not.toContain('iface eth0');
  });

  it('preserves unsupported interface directives in their generated stanza', () => {
    const parsed = parseDockerNetworkConfiguration('auto eth0\niface eth0 inet dhcp\n\tpre-up custom-command\n', 1);

    const serialized = serializeDockerNetworkConfiguration(parsed.preservedConfiguration, parsed.interfaces);

    expect(serialized).toContain('\tpre-up custom-command');
  });
});
