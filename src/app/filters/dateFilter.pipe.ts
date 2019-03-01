import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'datefilter'
})
export class DateFilter implements PipeTransform {
    transform(timestamp: string): string {
        let date = new Date(+timestamp*1000);

        let hours = date.getHours();
        let minutes = "0" + date.getMinutes();
        let seconds = "0" + date.getSeconds();

        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        return  hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + ' ' + day + '/' + month + '/' + year;
    } 
}
