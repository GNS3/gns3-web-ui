import { signal } from '@angular/core';
import { of } from 'rxjs';
import { expect, vi } from 'vitest';
import type { NodeConfigurationComponent } from '../node-configuration/node-configuration.component';

export function createConfigurationEditorStub() {
  const editor = {
    dirty: signal(false),
    busy: signal(false),
    saveBeforeApply: vi.fn<NodeConfigurationComponent['saveBeforeApply']>(() => of(true)),
    canLeave: vi.fn<NodeConfigurationComponent['canLeave']>(() => true),
  } satisfies Pick<NodeConfigurationComponent, 'dirty' | 'busy' | 'saveBeforeApply' | 'canLeave'>;
  // The configurator queries the concrete child, but its workflow only calls this subset.
  return { ...editor, component: editor as unknown as NodeConfigurationComponent };
}

export function stubConfigurationEditor(host: { configurationEditor: () => NodeConfigurationComponent }) {
  const editor = createConfigurationEditorStub();
  vi.spyOn(host, 'configurationEditor').mockReturnValue(editor.component);
  return editor;
}

/** Apply saves the Configuration tab first: when that is refused, the node is not updated. */
export function expectApplyToWaitForTheConfigurationTab(
  host: { configurationEditor: () => NodeConfigurationComponent; onSaveClick: () => void },
  updateNode: unknown,
) {
  const editor = stubConfigurationEditor(host);
  editor.dirty.set(true);
  editor.saveBeforeApply.mockReturnValue(of(false));
  host.onSaveClick();
  expect(editor.saveBeforeApply).toHaveBeenCalledOnce();
  expect(updateNode).not.toHaveBeenCalled();
}
