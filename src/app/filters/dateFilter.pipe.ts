import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'datefilter',
})
export class DateFilter implements PipeTransform {
  transform(timestamp: string): string {
    // Render in UTC with the same format as the server's default snapshot
    // description ("%Y-%m-%d at %H:%M:%S"), so both show identical datetimes.
    const date = new Date(+timestamp * 1000);
    const pad = (value: number) => String(value).padStart(2, '0');

    const datePart = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    const timePart = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
    return `${datePart} at ${timePart}`;
  }
}
