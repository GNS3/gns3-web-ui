import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'filenamefilter',
})
export class SearchFilter implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();
    return items.filter((item) => {
      return item.filename.toLowerCase().includes(searchText);
    });
  }
}
