import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'datefilter'
})
export class DateFilter implements PipeTransform {
    transform(timestamp: string): string {
        const date = new Date(+timestamp * 1000);

        const hours = date.getHours();
        const minutes = "0" + date.getMinutes();
        const seconds = "0" + date.getSeconds();

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return  hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + ' ' + day + '/' + month + '/' + year;
    } 
}
