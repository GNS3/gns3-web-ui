import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ControllerError } from './http-controller.service';
import {
  configurationErrorInfo,
  configurationErrorMessage,
  configurationErrorText,
  isMissingEndpoint,
  unwrapBlobError,
  startupFailureDetail,
  startupFailurePhaseLabel,
  STARTUP_MEDIA_APPLIED_TEXT,
  STARTUP_MEDIA_PREPARED_TEXT,
  STARTUP_WAITING_HINT,
} from './configuration-messages';

describe('configurationErrorText', () => {
  it('explains that a booted node keeps its saved state until it is wiped', () => {
    expect(configurationErrorText('saved_state_kept', 'startup')).toContain('Wipe the node');
  });

  it('maps the permission and concurrency codes the server returns', () => {
    expect(configurationErrorText('configuration_access_denied')).toContain('permission');
    expect(configurationErrorText('configuration_operation_in_progress')).toContain('already running');
    for (const context of ['capture', 'export', 'startup', 'wipe', 'sets'] as const) {
      expect(configurationErrorText('configuration_operation_in_progress', context)).toMatch(
        /capture or live apply is already running.*Wait for it to finish, then retry/,
      );
    }
    expect(configurationErrorText('startup_configurations_changed')).toContain('another session');
  });
  it('explains the pending console apply and keeps the status text short', () => {
    expect(configurationErrorText('waiting_for_console', 'startup').length).toBeLessThan(80);
    expect(STARTUP_WAITING_HINT).toMatch(/Close any open console window.*blocks it/);
    expect(configurationErrorText('prepared', 'startup')).toContain('do not log in by hand');
    expect(configurationErrorText('applying', 'startup')).toBe(
      'Applying the saved configuration through the console. Do not open a console on this node.',
    );
  });
  it('never returns a raw code for a known or unknown code', () => {
    expect(configurationErrorText('some_new_server_code')).toBe('some new server code');
    expect(configurationErrorText('')).toBe('Configuration operation failed');
    expect(configurationErrorText('Already a sentence.')).toBe('Already a sentence.');
  });
  it('lets a context reword a shared code', () => {
    expect(configurationErrorText('console_busy', 'capture')).toContain('console window is open');
    expect(configurationErrorText('console_busy', 'export')).toContain('Close it and retry the export');
    expect(configurationErrorText('console_busy', 'startup')).toContain('Close every console of this node');
    expect(configurationErrorText('console_unavailable', 'startup')).toContain('Close any console window');
    expect(configurationErrorText('console_unavailable', 'capture')).toContain('Close any console window');
    expect(configurationErrorText('startup_configurations_changed', 'sets')).toContain('Download your edits');
  });
  it('words console_unsafe_mode for exports', () => {
    expect(configurationErrorText('console_unsafe_mode', 'export')).toContain('(end)');
  });
  it('words capture, startup and wipe failures per surface', () => {
    expect(configurationErrorText('start_required', 'capture')).toContain('Start the node');
    expect(configurationErrorText('console_not_ready', 'startup')).toContain('not ready for restore');
    expect(configurationErrorText('stop_required', 'wipe')).toBe(
      'The node could not be stopped for wiping. Stop it manually, then retry.',
    );
    expect(configurationErrorText('node_not_found', 'wipe')).toBe('The node no longer exists in this project.');
    expect(configurationErrorText('configuration_wipe_unsupported', 'wipe')).toContain('unsupported');
    expect(configurationErrorText('device_type_required', 'startup')).toContain('Netmiko device type');
    expect(configurationErrorText('device_type_unsupported', 'startup')).toContain('no console recipe');
    expect(configurationErrorText('configuration_profile_mismatch', 'startup')).toContain('different device type');
    expect(configurationErrorText('configuration_restore_console_required', 'wipe')).toContain('Telnet or SSH');
    expect(configurationErrorText('configuration_apply_timeout', 'startup')).toContain('detail below');
    expect(configurationErrorText('configuration_apply_failed', 'startup')).toContain('server log');
    const login = configurationErrorText('console_authentication_failed', 'startup');
    expect(login).toContain('still be booting');
    expect(login).toContain('retries');
    expect(login).toContain('admin/admin');
  });
  it.each([
    ['configuration_apply_unsupported', /Startup configuration profile.*startup configuration OFF/],
    ['configuration_login_required', /needs a username entry.*Netmiko credentials sign in to an existing account/],
    ['configuration_extra_storage', /writable disk/],
    ['configuration_outcome_unknown', /interrupted\. Wipe it again/],
    ['configuration_mount_shadowed', /mounts/],
    ['configuration_image_changed', /image has changed/],
    ['invalid_startup_runtime', /startup state file/],
    ['device_type_required', /Netmiko device type/],
    ['configuration_profile_mismatch', /different device type/],
    ['configuration_restore_console_required', /Telnet or SSH/],
  ] as const)('gives the wipe reason for %s', (code, reason) => {
    expect(configurationErrorText(code, 'wipe')).toMatch(reason);
  });
});

describe('startup boot media texts', () => {
  it('words the boot media failures', () => {
    expect(configurationErrorText('boot_media_tool_missing', 'startup')).toBe(
      'The server needs xorriso, genisoimage or mkisofs (mtools for disk media, e2fsprogs for vEOS) to prepare the startup boot media.',
    );
    expect(configurationErrorText('boot_media_build_failed', 'startup')).toContain('could not be built');
    expect(configurationErrorText('boot_media_too_large', 'startup')).toContain('too large');
    expect(configurationErrorText('startup_media_profile_unknown', 'startup')).toContain('not known to the server');
    expect(configurationErrorText('configuration_apply_unsupported', 'startup')).toBe(
      'This configuration cannot be applied to this node type.',
    );
  });
  it('words the applied status honestly for boot media nodes and keeps console wording otherwise', () => {
    const text = configurationErrorText('applied', 'startup', { mediaProfile: true });
    expect(text).toBe(STARTUP_MEDIA_APPLIED_TEXT);
    expect(text).toContain('Boot media delivered');
    expect(text).toContain('Check the node console');
    expect(configurationErrorText('media_delivered', 'startup')).toBe(text);
    expect(text.length).toBeLessThan(120);
    expect(configurationErrorText('applied', 'startup')).toBe('Saved configuration applied successfully.');
  });
  it('words the prepared status for boot media nodes, keeping the console wording otherwise', () => {
    const text = configurationErrorText('prepared', 'startup', { mediaProfile: true });
    expect(text).toBe(STARTUP_MEDIA_PREPARED_TEXT);
    expect(text).toContain('first boot');
    expect(text).not.toContain('Wipe');
    expect(configurationErrorText('prepared', 'startup')).toContain('through the console');
  });
});

describe('configurationErrorInfo', () => {
  it('unwraps ControllerError, HttpErrorResponse and plain bodies', () => {
    const response = new HttpErrorResponse({ status: 403, error: { message: 'configuration_access_denied' } });
    for (const error of [
      response,
      ControllerError.fromError('x', response),
      { error: { message: 'configuration_access_denied' } },
    ]) {
      expect(configurationErrorInfo(error).code).toBe('configuration_access_denied');
    }
    expect(configurationErrorInfo(response).status).toBe(403);
  });
  it('reads FastAPI-style detail and string bodies', () => {
    expect(configurationErrorInfo({ error: { detail: 'start_required' } }).code).toBe('start_required');
    expect(configurationErrorInfo({ error: JSON.stringify({ message: 'console_busy' }) }).code).toBe('console_busy');
  });
  it('maps TimeoutError, including wrapped, to the timeout code', () => {
    expect(configurationErrorInfo(new TimeoutError()).code).toBe('configuration_request_timeout');
    expect(configurationErrorInfo({ originalError: new TimeoutError() }).timeout).toBe(true);
  });
  it('keeps a plain Error message and string errors as the message', () => {
    expect(configurationErrorInfo(new Error('console_busy')).message).toBe('console_busy');
    expect(configurationErrorInfo('boom').message).toBe('boom');
  });
});

describe('unwrapBlobError', () => {
  const blobWith = (body: unknown) => {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    return blob;
  };
  it('parses a Blob error body so the synchronous helpers can read it', async () => {
    const error = new HttpErrorResponse({ status: 403, error: blobWith({ message: 'configuration_access_denied' }) });
    const readable = await unwrapBlobError(ControllerError.fromError('x', error));
    expect(readable.status).toBe(403);
    expect(configurationErrorMessage(readable, 'export')).toContain('permission');
  });
  it('returns non-blob errors unchanged and survives an unreadable blob', async () => {
    const plain = { error: { message: 'x' } };
    expect(await unwrapBlobError(plain)).toBe(plain);
    const garbage = await unwrapBlobError({ error: new Blob(['not json']) });
    expect(configurationErrorMessage(garbage)).toBe('Configuration operation failed');
  });
});

describe('configurationErrorMessage', () => {
  it('turns a timeout into readable text, with the export wording naming 45 seconds', () => {
    expect(configurationErrorMessage(new TimeoutError())).toContain('did not respond in time');
    expect(configurationErrorMessage(new TimeoutError(), 'export')).toContain('45 seconds');
  });
  it('explains engine-specific export rejections', () => {
    const plain = { error: { message: 'invalid_configuration_request' } };
    expect(configurationErrorMessage(plain, 'export', { nodeType: 'docker' })).toContain('saved-file export request');
    expect(configurationErrorMessage(plain, 'export', { nodeType: 'qemu' })).toContain('Netmiko device type');
  });
  it('lists the first validation reasons for a rejected set', () => {
    const error = {
      error: {
        message: 'invalid_configuration_request',
        details: { validation_errors: [{ reason: 'content_too_large' }, { location: ['body', 'sets'] }] },
      },
    };
    expect(configurationErrorMessage(error, 'sets')).toBe(
      'Configuration set rejected: content too large; body.sets. Check these fields before retrying.',
    );
  });
  it('recognises a bare 404 as a missing endpoint, but keeps a specific 404', () => {
    const bare = new HttpErrorResponse({ status: 404, error: { message: 'Not found' } });
    expect(isMissingEndpoint(bare)).toBe(true);
    expect(isMissingEndpoint(ControllerError.fromError('Not found', bare))).toBe(true);
    expect(configurationErrorMessage(bare, 'wipe')).toContain('does not support Wipe (404)');
    expect(configurationErrorMessage(bare)).toContain('does not support this configuration operation (404)');
    const specific = new HttpErrorResponse({ status: 404, error: { message: 'Project is no longer available' } });
    expect(isMissingEndpoint(specific)).toBe(false);
    expect(configurationErrorMessage(specific)).toBe('Project is no longer available');
  });
  it('falls back to a generic sentence for an empty error', () => {
    expect(configurationErrorMessage(undefined)).toBe('Configuration operation failed');
  });
});

describe('VPCS export without a saved configuration', () => {
  it('explains it in every surface', () => {
    for (const context of ['capture', 'export'] as const) {
      const text = configurationErrorText('configuration_not_saved', context, { nodeType: 'vpcs' });
      expect(text).toContain('save command');
      expect(text).toContain('couple of seconds');
    }
    const error = new HttpErrorResponse({ status: 409, error: { message: 'configuration_not_saved' } });
    expect(configurationErrorMessage(error, 'export', { nodeType: 'vpcs' })).toContain('save command');
  });
});

describe('startup failure detail', () => {
  it('maps the phases the server reports and tolerates unknown ones', () => {
    expect(startupFailurePhaseLabel('login')).toBe('console login');
    expect(startupFailurePhaseLabel('ready')).toBe('waiting for the console prompt');
    expect(startupFailurePhaseLabel('console-wait')).toBe('waiting for the console to become free');
    expect(startupFailurePhaseLabel('prepare')).toBe('checking the device mode');
    expect(startupFailurePhaseLabel('enter')).toBe('entering configuration mode');
    expect(startupFailurePhaseLabel('replay')).toBe('applying configuration commands');
    expect(startupFailurePhaseLabel('save')).toBe('saving the configuration');
    expect(startupFailurePhaseLabel('brand-new')).toBe('stage brand-new');
    expect(startupFailurePhaseLabel(undefined)).toBe('');
  });
  it('builds the detail line from any subset of fields', () => {
    expect(
      startupFailureDetail({
        phase: 'replay',
        command_index: 6,
        command_total: 101,
        command: 'password <masked>',
        device_error: 'syntax error: password <masked>',
      }),
    ).toBe(
      'Failed at applying configuration commands (command 6 of 101): password <masked> -> syntax error: password <masked>',
    );
    expect(startupFailureDetail({ phase: 'save' })).toBe('Failed at saving the configuration');
    expect(startupFailureDetail({ command_index: 3 })).toBe('Failed (command 3)');
    expect(startupFailureDetail({ phase: 'zzz', device_error: 'boom' })).toBe('Failed at stage zzz: boom');
    expect(startupFailureDetail({})).toBe('');
    expect(startupFailureDetail(undefined)).toBe('');
    expect(startupFailureDetail({ phase: 'login', device_error: 'Login incorrect' })).toBe(
      'Failed at console login: Login incorrect',
    );
  });
  it('explains ready and console-wait failures', () => {
    expect(startupFailureDetail({ phase: 'ready', device_error: 'booting...' })).toBe(
      'Failed while waiting for the console prompt. Last console lines: booting...',
    );
    expect(startupFailureDetail({ phase: 'console-wait', device_error: 'console_busy' })).toBe(
      'Failed while waiting for the console to become free. Last retry: console_busy',
    );
    expect(startupFailureDetail({ phase: 'ready' })).toBe('Failed while waiting for the console prompt.');
  });
});
