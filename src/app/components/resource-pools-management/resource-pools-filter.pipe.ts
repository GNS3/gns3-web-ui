import { Pipe, PipeTransform } from '@angular/core';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { MatTableDataSource } from '@angular/material/table';

@Pipe({
  standalone: true,
  name: 'resourcePoolsFilter',
})
export class ResourcePoolsFilterPipe implements PipeTransform {
  transform(resourcePool: MatTableDataSource<ResourcePool>, searchText: string): MatTableDataSource<ResourcePool> {
    if (!searchText) {
      return resourcePool;
    }

    searchText = searchText.trim().toLowerCase();
    resourcePool.filter = searchText;
    return resourcePool;
  }
}
