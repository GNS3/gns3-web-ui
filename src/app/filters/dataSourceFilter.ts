import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'datasourcefilter'
})
export class DataSourceFilter implements PipeTransform {
    transform(items: any, searchText: string): any[] {
        if(!items) return [];
        if(!searchText) return items;
        
        searchText = searchText.toLowerCase();
            return items.filteredData.filter( item => {
              return item.name.toLowerCase().includes(searchText);
            });
    } 
}
