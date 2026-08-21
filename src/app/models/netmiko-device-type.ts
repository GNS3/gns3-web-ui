/**
 * GET /v3/netmiko/device_types — the device types supported by the netmiko
 * installed on the server. The list changes with the server's netmiko
 * version (plus gns3_-prefixed custom drivers), so it must be fetched,
 * never hardcoded.
 *
 * The server answers 501 (error body key `message`, not `detail`) when
 * netmiko is missing — the field itself still works, callers fall back to
 * free text.
 */
export interface NetmikoDeviceType {
  /** Value written to netmiko_device_type. */
  name: string;
  /** Telnet-based variant (_telnet) — most GNS3 consoles are Telnet. */
  telnet: boolean;
  /** GNS3 custom driver (gns3_ prefix), not built into netmiko. */
  custom: boolean;
}

export interface NetmikoDeviceTypesResponse {
  netmiko_version: string;
  device_types: NetmikoDeviceType[];
}
