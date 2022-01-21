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
