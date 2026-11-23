import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BpfRuleLibraryDialogComponent } from './bpf-rule-library-dialog.component';
import { BpfPresetsService } from '@services/bpf-presets.service';

const RULE_A = { name: 'Rule A', expression: 'tcp port 80', category: 'Custom' };
const RULE_B = { name: 'Rule B', expression: 'udp port 53', category: 'Custom' };

describe('BpfRuleLibraryDialogComponent', () => {
  let fixture: ComponentFixture<BpfRuleLibraryDialogComponent>;
  let component: BpfRuleLibraryDialogComponent;
  let mockLibrary: {
    builtInBpfPresets: unknown[];
    customBpfPresets: ReturnType<typeof signal>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let afterClosed: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    afterClosed = vi.fn().mockReturnValue(of(false));
    mockDialog = { open: vi.fn(() => ({ afterClosed })) };
    mockLibrary = {
      builtInBpfPresets: [],
      customBpfPresets: signal([RULE_A, RULE_B]),
      save: vi.fn(() => true),
      delete: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BpfRuleLibraryDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: BpfPresetsService, useValue: mockLibrary },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(BpfRuleLibraryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  const startRenamingRuleA = (targetName: string): void => {
    component.startEdit({ ...RULE_A, source: 'custom' });
    component.editorName.set(targetName);
  };

  it('asks before replacing an existing rule when renaming', () => {
    startRenamingRuleA('Rule B');

    component.saveEditor();

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    expect(mockLibrary.save).not.toHaveBeenCalled();
    expect(mockLibrary.delete).not.toHaveBeenCalled();
  });

  it('replaces the colliding rule and removes the renamed one after confirmation', () => {
    afterClosed.mockReturnValue(of(true));
    startRenamingRuleA('Rule B');

    component.saveEditor();

    expect(mockLibrary.save).toHaveBeenCalledWith('Rule B', 'tcp port 80');
    expect(mockLibrary.delete).toHaveBeenCalledWith('Rule A');
    expect(component.editorOpen()).toBe(false);
  });

  it('keeps both rules when the overwrite is declined', () => {
    afterClosed.mockReturnValue(of(false));
    startRenamingRuleA('Rule B');

    component.saveEditor();

    expect(mockLibrary.save).not.toHaveBeenCalled();
    expect(mockLibrary.delete).not.toHaveBeenCalled();
    expect(component.editorOpen()).toBe(true);
  });

  it('renames without confirmation when the target name is free', () => {
    startRenamingRuleA('Rule C');

    component.saveEditor();

    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(mockLibrary.save).toHaveBeenCalledWith('Rule C', 'tcp port 80');
    expect(mockLibrary.delete).toHaveBeenCalledWith('Rule A');
  });

  it('does not ask when the name is unchanged', () => {
    startRenamingRuleA('Rule A');

    component.saveEditor();

    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(mockLibrary.save).toHaveBeenCalledWith('Rule A', 'tcp port 80');
    expect(mockLibrary.delete).not.toHaveBeenCalled();
  });
});
