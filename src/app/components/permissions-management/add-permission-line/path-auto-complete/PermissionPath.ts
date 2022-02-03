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
import {SubPath} from "./SubPath";

export class PermissionPath {
  private subPath: SubPath[] = [];

  constructor() {
  }

  add(subPath: SubPath) {
    this.subPath.push(subPath);
  }

  getDisplayPath() {
    return this.subPath
      .map((subPath) => subPath.displayValue);
  }

  removeLast() {
    this.subPath.pop();
  }

  getPath() {
    return this.subPath.map((subPath) => subPath.value);
  }

  isEmpty() {
    return this.subPath.length === 0;
  }

  getVariables(): { key: string; value: string }[] {
    return this.subPath
      .filter((path) => path.key)
      .map((path) => {
        return {key: path.key, value: path.value};
      });
  }


  containStar() {
    return this.subPath
      .map(subPath => subPath.value === '*')
      .reduce((previous, next) => previous || next, false);
  }
}
