import { Pipe, PipeTransform } from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {User} from "@models/users/user";
import {ACE} from "@models/api/ACE";
import {Endpoint} from "@models/api/endpoint";

@Pipe({
  name: 'aceFilter'
})
export class AceFilterPipe implements PipeTransform {

  transform(items: MatTableDataSource<ACE>, searchText: string, endpoints: Endpoint[]){
    if (!items) return [];
    if (!searchText) return items;
    searchText = searchText.toLowerCase()
    const filteredEndpoints = endpoints.filter((endp: Endpoint) => endp.name.toLowerCase().includes(searchText))
    return items.data.filter((item: ACE) => {
      const user = this.getEndpoint(item.user_id, endpoints)
      const group = this.getEndpoint(item.group_id, endpoints)
      const path = this.getEndpoint(item.path, endpoints)
      const role = this.getEndpoint(item.role_id, endpoints)
      return filteredEndpoints.some((endp: Endpoint) => [user, group, path, role].includes(endp.endpoint))
    })

  }

  private getEndpoint(id: string, endpoints: Endpoint[]): string {
    const filter = endpoints.filter((endpoint: Endpoint) => endpoint.endpoint.includes(id))
    if(filter.length > 0) {
      return filter[0].endpoint.toLowerCase()
    }
    return ''
  }
}
