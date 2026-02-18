import { Pipe, PipeTransform } from '@angular/core';
import { Template } from '@models/template';

@Pipe({
  name: 'templatefilter',
})
export class TemplateFilter implements PipeTransform {
  transform(items: Template[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();
    return items.filter((item) => {
      return item.name.toLowerCase().includes(searchText);
    });
  }
}
