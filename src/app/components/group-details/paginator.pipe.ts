/*
* Software Name : GNS3 Web UI
* Version: 3
* SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
* SPDX-License-Identifier: GPL-3.0-or-later
*
* This software is distributed under the GPL-3.0 or any later version,
* the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
* or see the "LICENSE" file for more details.
*
* Author: Sylvain MATHIEU, Elise LEBEAU
*/
import {Pipe, PipeTransform} from '@angular/core';
import {User} from "@models/users/user";
import {PageEvent} from "@angular/material/paginator";

@Pipe({
  name: 'paginator'
})
export class PaginatorPipe implements PipeTransform {

  transform<T>(elements: T[] | undefined, paginatorEvent: PageEvent | undefined): T[] {
    if (!elements) {
      return [];
    }

    if (!paginatorEvent) {
      paginatorEvent = {
        length: elements.length,
        pageIndex: 0,
        pageSize: 5
      };
    }


    return elements.slice(
      paginatorEvent.pageIndex * paginatorEvent.pageSize,
      (paginatorEvent.pageIndex + 1) * paginatorEvent.pageSize);
  }

}
