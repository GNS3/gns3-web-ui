import {IPrivilegesChange} from "@components/role-management/role-detail/privilege/IPrivilegesChange";

export class PrivilegeChange {

  private change= {add: new Set<string>(), delete: new Set<string>()};

  constructor(public ownedPrivileges: string[]) {

  }

  public add(id: string) {

    if (this.change.delete.has(id)) {
      this.change.delete.delete(id);
    }
    if (this.ownedPrivileges.includes(id)) {
      return;
    }
    this.change.add.add(id);
  }

  public delete(id: string) {
    if (this.change.add.has(id)) {
      this.change.add.delete(id);
    }
    if (!this.ownedPrivileges.includes(id)) {
      return;
    }
    this.change.delete.add(id);
  }


  isAdded(id: string): boolean {
    return this.change.add.has(id);
  }

  isDeleted(id: string) {
    return this.change.delete.has(id);
  }

  get(): IPrivilegesChange {
    return {add: Array.from(this.change.add), delete: Array.from(this.change.delete)};
  }
}
