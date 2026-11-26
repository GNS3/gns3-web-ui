import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

/**
 * Every user-facing text for a configuration reason code lives here. The server
 * reports short codes (`console_busy`, `start_required`, ...); surfaces ask for
 * a text with `configurationErrorText(code, context)` or, for a caught error,
 * `configurationErrorMessage(error, context)`.
 *
 * Some codes read differently depending on what the user was doing, so a
 * context can override the base wording. Anything not overridden falls back to
 * the base text, and unknown codes are made readable instead of shown raw.
 */
import { StartupFailureContext } from '@models/startup-configuration';
export type ConfigurationErrorContext = 'capture' | 'export' | 'startup' | 'wipe' | 'sets';

interface ConfigurationErrorHints {
  /** Node type being exported, for wording that depends on the engine. */
  nodeType?: string;
  /** The node delivers its startup configuration as boot media (a startup media profile is selected). */
  mediaProfile?: boolean;
}

/**
 * Longer explanation shown next to the short `waiting_for_console` status: what
 * the node is doing and what the user should (not) do meanwhile.
 */
export const STARTUP_WAITING_HINT =
  'Waiting for the node to boot. The startup configuration is applied automatically once the console is ready. Close any open console window of this node: an open console blocks it. Do not log in by hand, first-login prompts are handled automatically.';

/** Status of a node whose startup configuration is delivered as boot media. */
export const STARTUP_MEDIA_PREPARED_TEXT = "Boot media prepared. It is applied on the node's first boot.";

/** Short status of a boot media node once the media is attached: the guest, not the server, applies it. */
export const STARTUP_MEDIA_APPLIED_TEXT =
  'Boot media delivered. Check the node console for the result of the guest’s import.';

/** The stages the server reports; anything else (a newer server) is shown as received. */
const FAILURE_PHASES: Record<string, string> = {
  ready: 'waiting for the console prompt',
  'console-wait': 'waiting for the console to become free',
  login: 'console login',
  prepare: 'checking the device mode',
  enter: 'entering configuration mode',
  replay: 'applying configuration commands',
  save: 'saving the configuration',
};
const MAX_DETAIL_VALUE = 200;
const clip = (value: string) => (value.length > MAX_DETAIL_VALUE ? `${value.slice(0, MAX_DETAIL_VALUE)}…` : value);

/** Human label of a failure stage; unknown stages from newer servers are shown as received. */
export function startupFailurePhaseLabel(phase: string | undefined): string {
  if (!phase) return '';
  return FAILURE_PHASES[phase] ?? `stage ${clip(phase)}`;
}

/**
 * One plain-text line describing where a startup apply stopped, from the
 * server's masked failure context. Every field is optional; returns '' when
 * there is nothing to show. Values are clipped, never interpreted as HTML.
 */
export function startupFailureDetail(application?: StartupFailureContext): string {
  if (!application) return '';
  const { phase, command_index, command_total, command, device_error } = application;
  if (!phase && !command_index && !command && !device_error) return '';
  const label = startupFailurePhaseLabel(phase);
  if (phase === 'ready' || phase === 'console-wait') {
    const intro = `Failed while ${label}.`;
    if (!device_error) return intro;
    return `${intro} ${phase === 'ready' ? 'Last console lines' : 'Last retry'}: ${clip(device_error)}`;
  }
  const position = command_index
    ? command_total
      ? `command ${command_index} of ${command_total}`
      : `command ${command_index}`
    : '';
  let detail = `Failed${label ? ` at ${label}` : ''}${position ? ` (${position})` : ''}`;
  const parts = [command && clip(command), device_error && clip(device_error)].filter(Boolean);
  if (parts.length) detail += `: ${parts.join(' -> ')}`;
  return detail;
}

const BASE: Record<string, string> = {
  // Access and concurrency
  configuration_access_denied:
    'You do not have permission for this configuration operation. Saving to a set, wiping and exporting a running device need more rights than a plain download.',
  configuration_operation_in_progress:
    'A configuration capture or live apply is already running in this project. Wait for it to finish, then retry.',
  startup_configurations_changed:
    'The saved configurations changed in another session. Your edits are retained; copy them before discarding and reloading.',
  project_closed: 'The project is closed. Open it before changing configurations.',
  node_locked: 'The node is locked. Unlock it before changing its configuration.',
  configuration_node_not_found: 'The node no longer exists in this project.',
  configuration_engine_unsupported: 'This node type does not support configuration operations.',
  configuration_apply_unsupported: 'This configuration cannot be applied to this node type.',
  configuration_request_timeout:
    'The server did not respond in time. The operation may still be running; check the server connection and the node console before retrying.',
  // Set interchange
  configuration_set_limit_reached:
    'The project already has the maximum number of configuration sets. Delete one first.',
  invalid_configuration_archive: 'The file is not a valid configuration set archive (.zip) exported from GNS3.',
  configuration_archive_mapping_conflict: 'The archive maps two nodes onto the same node.',
  configuration_set_not_found: 'The configuration set no longer exists. Reload and try again.',
  // Capture / export
  console_lease_unsupported:
    'Reading the configuration needs a Telnet or SSH console. Check the node’s console type, then stop and start the node.',
  start_required: 'Start the node before exporting its running configuration.',
  stop_required: 'Stop the node before exporting its saved configuration.',
  console_busy: 'A console window is open on this node. Close it and retry.',
  console_recovery_required: 'The console connection could not be recovered. Stop and start the node before retrying.',
  console_unsafe_mode:
    'Return the node console to its operational prompt before exporting. For Cisco IOS/IOS XE, enter end to leave configuration mode and reach the hostname# prompt, then disconnect the console and retry.',
  configuration_capture_timeout:
    'Configuration capture timed out. Check that the appliance is ready at its privileged prompt.',
  console_driver_unavailable:
    'Console configuration support is unavailable. Update the compute server and its dependencies.',
  device_version_unsupported: 'This software version is not supported by the selected configuration driver.',
  device_type_required:
    'Choose the node’s Netmiko device type in its General settings before using a saved startup configuration.',
  device_type_unsupported:
    'The node’s Netmiko device type has no console recipe, so its startup configuration cannot be applied. Choose a supported device type in General settings.',
  console_authentication_failed:
    'Console authentication failed. Check the node’s saved default username and password in General settings.',
  console_enable_secret_required:
    'The node requires a separate enable password. Enter privileged mode at its console, then disconnect and retry.',
  console_not_ready:
    'The console was not ready. Check for first-boot setup, password setup or command errors, then retry.',
  console_incomplete_output: 'The node did not return a complete configuration. Check its console before retrying.',
  no_declared_files: 'This container has no supported saved configuration files to export.',
  configuration_not_found: 'No saved configuration file was found for this node.',
  configuration_not_saved:
    'Nothing has been saved on this node yet. On a VPCS, run the save command at its console and wait a couple of seconds for the file to appear, then retry.',
  configuration_compute_unavailable: 'The compute server running this node could not be reached. Check it, then retry.',
  configuration_compute_identity_mismatch:
    'The compute server answered for a different node. Restart the compute server, then retry.',
  configuration_export_failed: 'The server could not export the configuration. Check the node console before retrying.',
  configuration_request_too_large: 'The request is too large for the server. Use a smaller configuration or archive.',
  configuration_archive_too_large: 'The archive is too large for the server.',
  configuration_invalid_content: 'This configuration text is not valid for the node’s device type.',
  configuration_too_large: 'The configuration is too large to export or store.',
  configuration_changed_during_capture:
    'The configuration changed while it was being read. Wait for the node to settle, then retry.',
  runtime_changed_during_capture: 'The node was restarted or changed while its configuration was being read. Retry.',
  capture_capacity_exhausted: 'The server is busy capturing other configurations. Wait a moment, then retry.',
  configuration_outcome_unknown:
    'The result of the operation is unknown. Check the node and its console before retrying.',
  configuration_read_failed: 'The saved configuration could not be read from the node. Check the node before retrying.',
  configuration_unavailable: 'The node’s configuration is not available right now. Start or stop the node, then retry.',
  configuration_mount_shadowed:
    'The configuration path is hidden by a volume mounted in the container, so it cannot be read or restored.',
  unsafe_configuration_file: 'The saved configuration file is not a regular file and was refused for safety.',
  unsafe_configuration_path: 'The configuration path is not safe and was refused.',
  invalid_nvram: 'The node’s NVRAM does not contain a readable configuration.',
  native_extraction_failed: 'The configuration could not be extracted from the node’s storage.',
  hypervisor_unavailable: 'The Dynamips hypervisor for this node is not available. Start the node, then retry.',
  container_state_unavailable: 'The container state could not be read. Check Docker on the compute server.',
  application_id_unavailable: 'The Docker application could not be identified. Check the container before retrying.',
  configuration_save_unsupported: 'Saving the configuration from the console is not supported for this device.',
  configuration_apply_unverified: 'The node accepted the commands, but its read-back did not match. Check the console.',
  configuration_apply_accepted: 'The node accepted the commands. This device does not have a comparable read-back.',
  configuration_verification_unavailable:
    'The node accepted the commands, but verification was unavailable. Check the console.',
  duplicate_configuration_set_names: 'Another set already has this name. Choose a different name.',
  duplicate_configuration_set_ids: 'Two sets share the same id. Reload the configurations.',
  selected_configuration_set_not_found: 'The selected set does not exist. Select an existing set.',
  configuration_image_required: 'Select a disk image for this node before using a startup configuration.',
  // Startup / restore
  configuration_profile_mismatch:
    'The saved startup configuration was made for a different device type than this node. Fetch or save the configuration again.',
  startup_media_profile_unknown:
    'The selected startup configuration profile is not known to the server. Choose another profile in the node’s settings, or update the server.',
  boot_media_tool_missing:
    'The server needs xorriso, genisoimage or mkisofs (mtools for disk media, e2fsprogs for vEOS) to prepare the startup boot media.',
  boot_media_build_failed: 'The startup boot media could not be built. Check the server log for details.',
  configuration_media_slot_unavailable:
    'Free a compatible drive slot in the node settings before using startup boot media.',
  configuration_factory_reset_failed:
    'The node’s disk could not be returned to its factory state. Check the server log, then wipe the node and start it again.',
  configuration_topology_unsupported:
    'This node cannot use startup boot media: ASAv needs KVM, at least 2048 MB RAM and a virtio disk; vEOS needs one linked-clone disk holding its flash.',
  boot_media_too_large: 'The startup configuration is too large for the startup boot media. Shorten it and retry.',
  waiting_for_console: 'Waiting for the device to boot and for its console to be free.',
  prepared:
    'Saved configuration prepared. It is applied through the console once the node has booted; do not log in by hand.',
  saved_state_kept:
    'The node keeps its saved state, so the startup configuration was not delivered. Wipe the node and start it again to apply it.',
  applying: 'Applying the saved configuration through the console. Do not open a console on this node.',
  applied: 'Saved configuration applied successfully.',
  cancelled: 'Configuration restore was cancelled.',
  configuration_apply_failed:
    'The appliance rejected the startup configuration. Check the node console and the server log for details; changes may be partially staged.',
  configuration_apply_timeout:
    'Startup application timed out waiting for the appliance or console. The detail below shows what the console was doing.',
  console_unavailable:
    'The appliance console was not available. Close any console window open on this node, then retry.',
  // Wipe
  configuration_wipe_unsupported:
    'Wipe and startup configuration are unsupported for this node: only the generic Linux network file and IOL containers can be restored.',
  configuration_restore_console_required:
    'Startup configuration is applied through the node’s console. Set its console type to Telnet or SSH, or turn its startup configuration off.',
  configuration_extra_storage:
    'The node’s additional QEMU options attach a writable disk that Wipe cannot reset. Remove it from the options or make it read-only (readonly=on), then wipe again.',
  configuration_image_changed: 'The node’s container image has changed since the container was created.',
  invalid_startup_runtime: 'The node’s startup state file cannot be read. Check the node folder on the compute server.',
  configuration_frr_volume_required:
    'This FRR container does not keep /etc/frr. Add /etc/frr to the node’s additional persistent directories.',
  configuration_login_required:
    'The saved controller-mode startup configuration needs a username entry. Netmiko credentials sign in to an existing account. Add a username entry or turn startup off.',
  configuration_job_still_running:
    'The job is still running on the server. Check its result in Startup configurations before retrying.',
  configuration_not_savable:
    'What the node returned cannot be saved to a configuration set. Download it without saving.',
  configuration_default_set_protected: 'The Default set cannot be renamed or deleted.',
  configuration_wipe_failed: 'The node could not be wiped. Check the node and the compute server, then retry.',
  configuration_operation_failed: 'The configuration operation failed. Check the node and the server, then retry.',
};

const OVERRIDES: Record<ConfigurationErrorContext, Record<string, string>> = {
  capture: {},
  sets: {
    startup_configurations_changed:
      'Configurations changed in another session. Download your edits, then reload before saving.',
  },
  export: {
    console_unsafe_mode: 'Leave configuration mode at the node console (end), then disconnect it and retry the export.',
    console_busy: 'A console window is open on this node. Close it and retry the export.',
    console_not_ready: 'The node console is not ready. Complete any setup or password prompts before exporting.',
    configuration_capture_timeout: 'Reading the node console timed out. Check that the guest is ready before retrying.',
    console_lease_unsupported: 'This node does not have a supported Telnet or SSH console for export.',
    configuration_request_timeout:
      'The export server did not respond within 45 seconds. Check the server connection and node console before retrying.',
    configuration_access_denied:
      'You do not have permission to export this node’s configuration. Reading a running device also needs console access.',
  },
  startup: {
    console_authentication_failed:
      'Console login failed. The device may still be booting, and the automation retries a few times. Check the node’s default username and password (the factory login is admin/admin), then stop and start the node.',
    console_not_ready:
      'The console was not ready for restore. Check for first-boot setup, password setup or command errors.',
    device_version_unsupported: 'The selected configuration driver does not support this appliance version.',
    console_busy:
      'The startup configuration could not be applied because a console window is open on this node. Close every console of this node, then stop and start it.',
    console_unavailable:
      'The console was not available for the startup configuration. Close any console window open on this node, then stop and start it.',
    console_unsafe_mode:
      'Could not reach the appliance’s operational prompt for startup configuration. Finish any interactive setup and retry.',
    console_lease_unsupported:
      'Startup application needs a Telnet or SSH console. Check the node’s console type, then stop and start the node.',
    console_incomplete_output: 'Startup application timed out waiting for an appliance response.',
  },
  wipe: {
    stop_required: 'The node could not be stopped for wiping. Stop it manually, then retry.',
    node_not_found: 'The node no longer exists in this project.',
    configuration_wipe_unsupported:
      'Wipe is unsupported for this node: a QEMU node needs linked-clone disks, and a Docker node must be an IOL container or use only the generic Linux network file.',
    configuration_outcome_unknown: 'A reset of this node was interrupted. Wipe it again to finish it.',
    configuration_image_required: 'The node’s container image is not available. Check Docker on the compute server.',
    configuration_image_changed:
      'The node’s container image has changed since the container was created. Recreate the node, or restore the previous image.',
    configuration_mount_shadowed:
      'The container has mounts or extra configuration files that a wipe cannot recreate. Remove them from the node settings, then wipe again.',
    configuration_apply_unsupported:
      'Its saved startup configuration cannot be delivered with the current settings. Select the matching Startup configuration profile for the node instead of Console, or turn its startup configuration OFF, then wipe again.',
  },
};

/** A text for a reason code; unknown codes are made readable, never returned as raw ids. */
export function configurationErrorText(
  code: string,
  context: ConfigurationErrorContext = 'capture',
  hints: ConfigurationErrorHints = {},
): string {
  if (!code) return 'Configuration operation failed';
  if (hints.mediaProfile && code === 'prepared') return STARTUP_MEDIA_PREPARED_TEXT;
  if (hints.mediaProfile && code === 'applied') return STARTUP_MEDIA_APPLIED_TEXT;
  if (code === 'media_delivered') return STARTUP_MEDIA_APPLIED_TEXT;
  const known = OVERRIDES[context]?.[code] ?? BASE[code];
  if (known) return known;
  // Codes are lowercase words joined by underscores. Anything else is already prose.
  return /^[a-z0-9_]+$/.test(code) ? code.replace(/_/g, ' ') : code;
}

/** `Name: reason` for every node of a capture job that was not captured; the caller joins and trims them. */
export function captureFailureMessages(results: Record<string, string>, nameOf: (id: string) => string): string[] {
  return Object.entries(results)
    .filter(([, result]) => result !== 'captured')
    .map(([id, result]) => `${nameOf(id)}: ${configurationErrorText(result, 'capture')}`);
}

/** What the server or the transport said, with every wrapper peeled off. */
interface ConfigurationErrorInfo {
  code?: string;
  /** A human sentence that was not a reason code (e.g. an Error message from the client). */
  message?: string;
  status?: number;
  validationErrors: any[];
  timeout: boolean;
}

function parseBody(body: unknown): any {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return { message: body };
    }
  }
  return body;
}

/**
 * Normalise an error from the controller layer: `ControllerError.originalError`,
 * `HttpErrorResponse`, rxjs `TimeoutError`, a plain `Error` or a string. A Blob
 * body (responseType 'blob') cannot be read synchronously; resolve it first with
 * `unwrapBlobError`.
 */
export function configurationErrorInfo(error: any): ConfigurationErrorInfo {
  const response = error?.originalError || error;
  if (error instanceof TimeoutError || response instanceof TimeoutError || response?.name === 'TimeoutError') {
    return { code: 'configuration_request_timeout', status: undefined, validationErrors: [], timeout: true };
  }
  const body = parseBody(
    response instanceof HttpErrorResponse || response?.error !== undefined ? response.error : undefined,
  );
  const isObject = body && typeof body === 'object' && !(body instanceof Blob);
  const code = isObject ? body.message || (typeof body.detail === 'string' ? body.detail : undefined) : undefined;
  const validationErrors =
    isObject && Array.isArray(body.details?.validation_errors) ? body.details.validation_errors : [];
  const message = typeof response === 'string' ? response : response?.message;
  return {
    code,
    message: code ? undefined : message,
    status: response?.status,
    validationErrors,
    timeout: false,
  };
}

/**
 * Blob responses carry their JSON error body as a Blob. Returns an error whose
 * body is parsed so the synchronous helpers can read it; any other error is
 * returned unchanged.
 */
export async function unwrapBlobError(error: any): Promise<any> {
  const response = error?.originalError || error;
  if (!(response?.error instanceof Blob)) return error;
  let body: unknown;
  try {
    body = JSON.parse(await response.error.text());
  } catch {
    body = undefined;
  }
  return { status: response.status, message: response.message, error: body };
}

/** A bare 404 ("Not found"): the server is too old to have this configuration endpoint. */
export function isMissingEndpoint(error: any): boolean {
  const info = configurationErrorInfo(error);
  const reason = info.code || info.message;
  return info.status === 404 && (!reason || /^not found$/i.test(reason));
}

/** The one text for a caught configuration error on any surface. */
export function configurationErrorMessage(
  error: any,
  context: ConfigurationErrorContext = 'capture',
  hints: ConfigurationErrorHints = {},
): string {
  const info = configurationErrorInfo(error);
  if (info.code === 'invalid_configuration_request') {
    const problems = info.validationErrors;
    if (context === 'export') {
      return hints.nodeType === 'docker'
        ? 'The server rejected the saved-file export request. Check that the GNS3 server is up to date.'
        : 'The server rejected the export request. Check the node’s Netmiko device type and console credentials.';
    }
    const locations = problems
      .slice(0, 3)
      .map((problem) => problem.reason?.replace(/_/g, ' ') || problem.location?.join('.'))
      .filter(Boolean);
    return locations.length
      ? `Configuration set rejected: ${locations.join('; ')}. Check these fields before retrying.`
      : 'The server rejected the configuration request. Check that the GNS3 server is up to date.';
  }
  if (isMissingEndpoint(error)) {
    const feature = context === 'wipe' ? 'Wipe' : 'this configuration operation';
    return `This GNS3 server does not support ${feature} (404). Update the server, including any remote compute server, then reopen the project.`;
  }
  if (info.code) return configurationErrorText(info.code, context, hints);
  return info.message ? configurationErrorText(info.message, context, hints) : 'Configuration operation failed';
}
