import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrivilegeComponent } from './privilege.component';
import { Privilege } from '@models/api/Privilege';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('PrivilegeComponent', () => {
  let component: PrivilegeComponent;
  let fixture: ComponentFixture<PrivilegeComponent>;
  let updateEmitSpy: ReturnType<typeof vi.fn>;

  const mockPrivileges: Privilege[] = [
    {
      name: 'read.project',
      description: 'Read project',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      privilege_id: 'priv-1',
    },
    {
      name: 'write.project',
      description: 'Write project',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      privilege_id: 'priv-2',
    },
    {
      name: 'read.topology',
      description: 'Read topology',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      privilege_id: 'priv-3',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivilegeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivilegeComponent);
    component = fixture.componentInstance;
    updateEmitSpy = vi.fn();
    (component.update.emit as ReturnType<typeof vi.fn>) = updateEmitSpy;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('collapsed state', () => {
    it('should render collapsed by default', () => {
      expect(component.collapsed).toBe(true);
    });

    it('should expand when toggleCollapsed is called', () => {
      component.toggleCollapsed();
      expect(component.collapsed).toBe(false);
    });

    it('should collapse when toggleCollapsed is called twice', () => {
      component.toggleCollapsed();
      component.toggleCollapsed();
      expect(component.collapsed).toBe(true);
    });
  });

  describe('editMode', () => {
    it('should start with editMode false', () => {
      expect(component.editMode).toBe(false);
    });

    it('should set editMode to true', () => {
      component.editMode = true;
      expect(component.editMode).toBe(true);
    });

    it('should reset changer when editMode is set to true', () => {
      component.ownedPrivilege = mockPrivileges;
      component.editMode = true;
      component.onPrivilegeChange(true, mockPrivileges[0]);
      component.editMode = false;
      component.editMode = true;
      expect(component.editMode).toBe(true);
    });
  });

  describe('privilege changes', () => {
    beforeEach(() => {
      component.ownedPrivilege = mockPrivileges;
      component.editMode = true;
    });

    it('should add privilege when checkbox is checked', () => {
      component.onPrivilegeChange(true, mockPrivileges[0]);
      expect(updateEmitSpy).not.toHaveBeenCalled();
    });

    it('should remove privilege from changer when checkbox is unchecked', () => {
      component.onPrivilegeChange(true, mockPrivileges[0]);
      component.onPrivilegeChange(false, mockPrivileges[0]);
      expect(updateEmitSpy).not.toHaveBeenCalled();
    });
  });

  describe('close method', () => {
    beforeEach(() => {
      component.ownedPrivilege = mockPrivileges;
      component.editMode = true;
    });

    it('should emit update event with changes', () => {
      // priv-1 (read.project) and priv-2 (write.project) are already owned
      // adding priv-1 again does nothing, removing priv-2 creates a delete
      component.onPrivilegeChange(true, mockPrivileges[0]);
      component.onPrivilegeChange(false, mockPrivileges[1]);
      component.close();
      expect(updateEmitSpy).toHaveBeenCalledWith({
        add: [],
        delete: [mockPrivileges[1].privilege_id],
      });
    });

    it('should set editMode to false after close', () => {
      component.close();
      expect(component.editMode).toBe(false);
    });

    it('should emit empty changes when no privileges were modified', () => {
      component.close();
      expect(updateEmitSpy).toHaveBeenCalledWith({ add: [], delete: [] });
    });
  });

  describe('disable input', () => {
    it('should render edit button when disable is false', () => {
      fixture.componentRef.setInput('disable', false);
      fixture.detectChanges();
      const editButton = fixture.nativeElement.querySelector('button[matTooltip="Edit privileges"]');
      expect(editButton).toBeTruthy();
    });

    it('should not render edit button when disable is true', () => {
      fixture.componentRef.setInput('disable', true);
      fixture.detectChanges();
      const editButton = fixture.nativeElement.querySelector('button[matTooltip="Edit privileges"]');
      expect(editButton).toBeFalsy();
    });
  });

  describe('ownedPrivilege input', () => {
    it('should populate ownedPrivilegesName and ownedPrivilegesList', () => {
      component.ownedPrivilege = mockPrivileges;
      // mockPrivileges: read.project, write.project, read.topology -> names: read, write, read
      expect(component.ownedPrivilegesName()).toEqual(['read', 'write', 'read']);
      expect(component.ownedPrivilegesList()).toEqual(['priv-1', 'priv-2', 'priv-3']);
    });

    it('should handle empty ownedPrivilege', () => {
      component.ownedPrivilege = [];
      expect(component.ownedPrivilegesName()).toEqual([]);
      expect(component.ownedPrivilegesList()).toEqual([]);
    });
  });
});
