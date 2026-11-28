import { createConfigurationEditorStub } from './configuration-editor.stub';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configurationAllowsLeaving,
  ConfiguratorHost,
  saveConfigurationThenUpdate,
} from './configurator-configuration-tab';

describe('configurator configuration helper', () => {
  let editor: ReturnType<typeof createConfigurationEditorStub>;
  let host: ConfiguratorHost;
  let toaster: { warning: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    toaster = { warning: vi.fn() };
    editor = createConfigurationEditorStub();
    host = {
      editor: editor.component,
      isApplying: signal(false),
      dialogRef: { disableClose: false } as any,
      toaster: toaster as any,
    };
  });

  describe('saveConfigurationThenUpdate', () => {
    it('saves the configuration first, then updates the node, and locks the dialog while running', () => {
      const configuration = new Subject<boolean>();
      editor.saveBeforeApply.mockReturnValue(configuration);
      const update = new Subject<string>();
      const updateFn = vi.fn(() => update);
      const next = vi.fn();
      saveConfigurationThenUpdate(host, updateFn).subscribe(next);
      expect(editor.saveBeforeApply).toHaveBeenCalledOnce();
      expect(updateFn).not.toHaveBeenCalled();
      expect(host.isApplying()).toBe(true);
      expect(host.dialogRef.disableClose).toBe(true);
      configuration.next(true);
      configuration.complete();
      expect(updateFn).toHaveBeenCalledTimes(1);
      update.next('saved-node');
      expect(next).toHaveBeenCalledWith('saved-node');
      update.complete();
      expect(host.isApplying()).toBe(false);
      expect(host.dialogRef.disableClose).toBe(false);
    });

    it('works without the tab (never opened) and just updates the node', () => {
      host.editor = undefined;
      const next = vi.fn();
      saveConfigurationThenUpdate(host, () => of('node')).subscribe(next);
      expect(next).toHaveBeenCalledWith('node');
      expect(host.isApplying()).toBe(false);
    });

    it('does not update the node when the configuration could not be saved, and keeps the dialog open', () => {
      editor.saveBeforeApply.mockReturnValue(of(false));
      editor.dirty.set(true);
      const updateFn = vi.fn(() => of('node'));
      const next = vi.fn();
      const complete = vi.fn();
      saveConfigurationThenUpdate(host, updateFn).subscribe({ next, complete });
      expect(updateFn).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(complete).toHaveBeenCalled();
      expect(host.isApplying()).toBe(false);
      expect(host.dialogRef.disableClose).toBe(true);
    });

    it.each(['configuration', 'node settings'])('allows a retry after a failed %s save', (failure) => {
      const update = vi.fn(() => of('node'));
      if (failure === 'configuration') editor.saveBeforeApply.mockReturnValueOnce(of(false));
      else update.mockReturnValueOnce(throwError(() => new Error('update failed')));

      const next = vi.fn();
      saveConfigurationThenUpdate(host, update).subscribe({ next, error: () => undefined });
      expect(next).not.toHaveBeenCalled();
      expect(host.isApplying()).toBe(false);
      saveConfigurationThenUpdate(host, update).subscribe(next);
      expect(next).toHaveBeenCalledWith('node');
      expect(update).toHaveBeenCalledTimes(failure === 'configuration' ? 1 : 2);
    });

    it('keeps the dialog locked while the tab is busy after the update finishes', () => {
      editor.busy.set(true);
      saveConfigurationThenUpdate(host, () => of('node')).subscribe();
      expect(host.dialogRef.disableClose).toBe(true);
    });

    it('tells the user the configuration was saved when only the node update fails', () => {
      editor.dirty.set(true);
      const failed = vi.fn();
      const error = new Error('node update failed');
      saveConfigurationThenUpdate(host, () => throwError(() => error)).subscribe({ error: failed });
      expect(failed).toHaveBeenCalledWith(error);
      expect(toaster.warning).toHaveBeenCalledWith(expect.stringContaining('configuration was saved'));
      expect(host.isApplying()).toBe(false);
    });

    it('does not claim a save when there were no configuration edits', () => {
      saveConfigurationThenUpdate(host, () => throwError(() => new Error('x'))).subscribe({ error: () => undefined });
      expect(toaster.warning).not.toHaveBeenCalled();
    });
  });

  describe('configurationAllowsLeaving', () => {
    it('defers to the tab, and allows leaving without one', () => {
      expect(configurationAllowsLeaving(undefined)).toBe(true);
      expect(configurationAllowsLeaving(editor.component)).toBe(true);
      editor.canLeave.mockReturnValue(false);
      expect(configurationAllowsLeaving(editor.component)).toBe(false);
    });
  });
});
