import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { GroupMcpToolsDialogComponent } from './group-mcp-tools-dialog.component';
import { GroupService } from '@services/group.service';
import { ToasterService } from '@services/toaster.service';
import { PermissionService } from '@services/permission.service';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';

describe('GroupMcpToolsDialogComponent (stale whitelist entries)', () => {
  let fixture: ComponentFixture<GroupMcpToolsDialogComponent>;
  let component: GroupMcpToolsDialogComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let groupService: any;

  const controller = { id: 1 } as Controller;
  const group = { user_group_id: 'g1', name: 'Operators' } as Group;
  /** The stored whitelist still holds a tool the current candidates no longer offer. */
  const response = {
    candidates: ['live-tool'],
    tools: ['live-tool', 'retired-tool'],
    descriptions: { 'live-tool': 'Live tool' },
    bypass: false,
  };

  function saveButton(): HTMLButtonElement {
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    return buttons.find((button) => button.textContent?.trim() === 'Save') as HTMLButtonElement;
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    groupService = {
      getMcpTools: vi.fn().mockReturnValue(of(response)),
      updateMcpTools: vi.fn().mockReturnValue(of(response)),
      clearMcpTools: vi.fn().mockReturnValue(of(undefined)),
    };
    const privileges = signal<ReadonlySet<string>>(new Set(['Group.Modify']));

    await TestBed.configureTestingModule({
      imports: [GroupMcpToolsDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { group, controller } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: GroupService, useValue: groupService },
        { provide: ToasterService, useValue: { success: vi.fn(), error: vi.fn() } },
        {
          provide: PermissionService,
          useValue: {
            privileges,
            has: (privilege: string) => privileges().has(privilege),
            hasAny: (list: string[]) => list.some((privilege) => privileges().has(privilege)),
            loaded: signal(true),
            isSuperadmin: signal(false),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupMcpToolsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  it('treats a pending stale-entry cleanup as a change worth saving', () => {
    expect(component.staleTools()).toEqual(['retired-tool']);
    expect(component.isDirty()).toBe(true);
  });

  it('enables Save when removing stale entries is the only pending change', () => {
    expect(saveButton().disabled).toBe(false);
  });

  it('saves the candidate intersection, dropping the stale entry', () => {
    saveButton().click();

    expect(groupService.updateMcpTools).toHaveBeenCalledWith(controller, 'g1', ['live-tool']);
  });
});
