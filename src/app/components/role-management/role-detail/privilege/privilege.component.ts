import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Privilege} from "@models/api/Privilege";
import {PrivilegeChange} from "@components/role-management/role-detail/privilege/privilegeChange";
import {IPrivilegesChange} from "@components/role-management/role-detail/privilege/IPrivilegesChange";

@Component({
  selector: 'app-privilege',
  templateUrl: './privilege.component.html',
  styleUrls: ['./privilege.component.scss']
})
export class PrivilegeComponent implements OnInit {

  @Input() disable = true;
  @Input() privileges: Privilege[] = [];
  @Input() ownedPrivilegesList: string[] = []
  @Output() update: EventEmitter<IPrivilegesChange> = new EventEmitter<IPrivilegesChange>();

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
