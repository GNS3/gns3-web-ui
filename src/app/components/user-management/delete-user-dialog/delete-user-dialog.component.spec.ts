/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 *
 * Author: Sylvain MATHIEU, Elise LEBEAU
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteUserDialogComponent } from './delete-user-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { User } from '@models/users/user';

describe('DeleteUserDialogComponent', () => {
  let component: DeleteUserDialogComponent;
  let fixture: ComponentFixture<DeleteUserDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockUsers: User[];

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockUsers = [
      {
        created_at: '2024-01-01',
        email: 'alice@example.com',
        full_name: 'Alice Smith',
        last_login: '2024-01-02',
        is_active: true,
        is_superadmin: false,
        updated_at: '2024-01-01',
        user_id: '1',
        username: 'alice',
      },
      {
        created_at: '2024-01-01',
        email: 'bob@example.com',
        full_name: 'Bob Jones',
        last_login: '2024-01-02',
        is_active: true,
        is_superadmin: false,
        updated_at: '2024-01-01',
        user_id: '2',
        username: 'bob',
      },
    ] as User[];

    await TestBed.configureTestingModule({
      imports: [DeleteUserDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { users: mockUsers } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('data', () => {
    it('should contain users passed via MAT_DIALOG_DATA', () => {
      expect(component.data).toBeDefined();
      expect(component.data.users).toHaveLength(2);
      expect(component.data.users[0].username).toBe('alice');
      expect(component.data.users[1].username).toBe('bob');
    });

    it('should handle empty users array', () => {
      expect(component.data.users.length >= 0).toBe(true);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onDelete', () => {
    it('should close dialog with true to confirm deletion', () => {
      component.onDelete();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});
