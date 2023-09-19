import { Pipe, PipeTransform } from '@angular/core';
import {Privilege} from "@models/api/Privilege";

@Pipe({
  name: 'groupPrivileges'
})
export class GroupPrivilegesPipe implements PipeTransform {

  transform(privileges: Privilege[]) {
    if(privileges) {
      const groups: { [index: string]: {verb: string, privilege: Privilege}[]} = {}
      privileges.forEach((privilege) => {
        const [name, verb] = privilege.name.split(".");
        if(!groups.hasOwnProperty(name)) {
          groups[name] = [{verb, privilege}];
        } else {
          groups[name].push({verb, privilege});
        }
      });

      const output: {key: string; values: {verb: string; privilege: Privilege}[]}[] = [];
      for(const [ key, values] of Object.entries(groups)) {
        output.push({key, values});
      }

      return output;
    }

  }

}
