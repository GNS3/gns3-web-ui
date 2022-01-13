import { Pipe, PipeTransform } from '@angular/core';
import {IFormatedList} from "@services/api-information.service";

@Pipe({
  name: 'filterComplete'
})
export class FilterCompletePipe implements PipeTransform {

  transform(value: IFormatedList[], searchText: string): IFormatedList[] {
    if (!searchText || searchText === '') { return value; }

    return value.filter((v) => {
      return v.name.includes(searchText) || v.id.includes(searchText);
    });
  }

}
