/**
 * A native boot media profile of the server catalog
 * (`GET /v3/startup-media-profiles`). The entry's `device_type` stays the console
 * recipe of the appliance.
 */
export interface StartupMediaProfile {
  id: string;
  title: string;
  device_type: string;
  description: string;
}

/**
 * Device types of the profiles shipped with the server. The device type is needed
 * synchronously (capabilities), before the catalog has been fetched, so this build
 * knows the shipped profiles; the fetched catalog (below) takes precedence and adds
 * the profiles of a newer server.
 */
const SHIPPED_DEVICE_TYPES: Readonly<Record<string, string>> = {
  'arista-veos': 'arista_eos',
  'cisco-asav': 'cisco_asa',
  'cisco-cat9kv': 'cisco_ios_telnet',
  'cisco-c8000v-autonomous': 'cisco_ios_telnet',
  'cisco-c8000v-controller': 'cisco_ios_telnet',
  'cisco-iosv': 'cisco_ios_telnet',
  'cisco-iosxrv9k': 'cisco_xr',
  'cisco-nxosv9k': 'cisco_nxos',
  'cisco-viptela': 'cisco_viptela',
  'juniper-vsrx': 'juniper_junos',
  'paloalto-panos': 'paloalto_panos',
};

export type StartupProfileLookup = (id: string) => string | undefined;

/** Consult the current controller catalog first, with shipped profiles as a fallback. */
export function startupMediaProfileDeviceType(
  profileId: string | null | undefined,
  lookup?: StartupProfileLookup,
): string | undefined {
  return profileId ? lookup?.(profileId) || SHIPPED_DEVICE_TYPES[profileId] : undefined;
}

/**
 * The value to store in `startup_media_profile` when saving, or `undefined` to leave the property untouched:
 * a node or template that never had a profile and still has none must not send the field, because older servers
 * do not know it.
 */
export function startupMediaProfileToSave(
  selected: string | null | undefined,
  current: string | null | undefined,
): string | null | undefined {
  const profile = selected?.trim() || null;
  return profile || current ? profile : undefined;
}
