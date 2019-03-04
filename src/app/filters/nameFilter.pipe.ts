import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'namefilter'
})
export class NameFilter implements PipeTransform {
    transform(items: any[], searchText: string): any[] {
        if(!items) return [];
        if(!searchText) return items;
        
        searchText = searchText.toLowerCase();
            return items.filter( item => {
              return item.name.toLowerCase().includes(searchText);
            });
    } 
}
