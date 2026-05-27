import { Pipe, PipeTransform } from '@angular/core';
import { ProjectDataSource } from '@components/projects/projects.component';

@Pipe({
  standalone: true,
  name: 'projectsfilter',
})
export class ProjectsFilter implements PipeTransform {
  transform(items: ProjectDataSource, searchText: string) {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();
    return items.projectDatabase.data.filter((item) => {
      // Search in both project name and created_by fields
      const nameMatch = item.name?.toLowerCase().includes(searchText);
      const createdByMatch = item.created_by?.toLowerCase().includes(searchText);
      return nameMatch || createdByMatch;
    });
  }
}
