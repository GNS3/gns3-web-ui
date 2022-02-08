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
import { Pipe, PipeTransform } from '@angular/core';
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

@Pipe({
  name: 'filterComplete'
})
export class FilterCompletePipe implements PipeTransform {

  transform(value: IGenericApiObject[], searchText: string): IGenericApiObject[] {
    if (!searchText || searchText === '') { return value; }

    return value.filter((v) => {
      return v.name.includes(searchText) || v.id.includes(searchText);
    });
  }

}
