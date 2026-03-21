import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {Privilege} from "@models/api/Privilege";
import {PrivilegeChange} from "@components/role-management/role-detail/privilege/privilegeChange";
import {IPrivilegesChange} from "@components/role-management/role-detail/privilege/IPrivilegesChange";
import {GroupPrivilegesPipe} from "@components/role-management/role-detail/privilege/group-privileges.pipe";

@Component({
  standalone: true,
  selector: 'app-privilege',
  templateUrl: './privilege.component.html',
  styleUrls: ['./privilege.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCheckboxModule, GroupPrivilegesPipe]
})
export class PrivilegeComponent implements OnInit {

  @Input() disable = true;
  @Input() privileges: Privilege[] = [];
  @Input() set ownedPrivilege(privileges: Privilege[]) {
    if(privileges) {
      this.ownedPrivilegesName = privileges.map((p: Privilege) => p.name.split(".")[0])
      this.ownedPrivilegesList = privileges.map((p: Privilege) => p.privilege_id);
    }
  }
  @Output() update: EventEmitter<IPrivilegesChange> = new EventEmitter<IPrivilegesChange>();

  ownedPrivilegesName: string[] = [];
  ownedPrivilegesList: string[] = [];
  changer = new PrivilegeChange(this.ownedPrivilegesList);
  private editModeState = false;

  get editMode(): boolean {
    return this.editModeState;
  };
  set editMode(state: boolean) {
    if(state) {
      this.changer = new PrivilegeChange(this.ownedPrivilegesList);
    }
    this.editModeState = state;
  };
  constructor() { }

  ngOnInit(): void {
  }

  onPrivilegeChange(checked: boolean, privilege: Privilege) {
      const id = privilege.privilege_id
      if(checked) {
        this.changer.add(id);
      } else {
        this.changer.delete(id);
      }
  }
  close() {
    this.update.emit(this.changer.get())
    this.editMode = false;
  }
}
