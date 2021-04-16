import { Pipe, PipeTransform } from '@angular/core';
import { ProjectDataSource } from '../components/projects/projects.component';

@Pipe({
  name: 'projectsfilter',
})
export class ProjectsFilter implements PipeTransform {
  transform(items: ProjectDataSource, searchText: string) {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();
    return items.projectDatabase.data.filter((item) => {
      return item.filename.toLowerCase().includes(searchText);
    });
  }
}
