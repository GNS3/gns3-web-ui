import {IApiData} from "./IApiData";
import {Server} from "../../models/server";
import {IExtraParams} from "./IExtraParams";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

export class ApiInformationCache {

  private cache = new Map<string, IApiData>();


  public update(server: Server, key: string, value: string, extraParams: IExtraParams[], data: IGenericApiObject[]) {
    const dataKey = this.generateKey(server, key, value, extraParams);
    this.cache.set(dataKey, {expired: Date.now() + 10000, data});
  }

  public get(server: Server, key: string, value: string, extraParams: IExtraParams[]): IGenericApiObject[] | undefined {
    const dataKey = this.generateKey(server, key, value, extraParams);
    const data = this.cache.get(dataKey);
    if (data) {
      if (data.expired > Date.now()) {
        return data.data;
      }
    }

  }

  private generateKey(server: Server, key: string, value: string, extraParams: IExtraParams[]) {
    return `${server.id}-${key}-${value}-${extraParams.map(param => `${param.key}+${param.value}`).join('.')}`;
  }

  searchByName(name: string) {
    const result: IGenericApiObject[] = [];
    this.cache.forEach((apiData: IApiData) => {
      apiData.data.forEach((value: IGenericApiObject) => {
        if (value.name.includes(name)) {
          result.push(value);
        }
      });
    });

    return result;
  }
}
