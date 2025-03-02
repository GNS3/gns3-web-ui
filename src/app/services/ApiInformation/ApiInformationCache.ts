import {IApiData} from "./IApiData";
import {Controller} from "@models/controller";
import {IExtraParams} from "./IExtraParams";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

/**
 * create cache to keep controller information on client side
 * reduce number of requests to the controller
 */
export class ApiInformationCache {

  private cache = new Map<string, IApiData>();


  public update(controller: Controller, key: string, value: string, extraParams: IExtraParams[], data: IGenericApiObject[]) {
    const dataKey = this.generateKey(controller, key, value, extraParams);
    this.cache.set(dataKey, {expired: Date.now() + 10000, data});
  }

  public get(controller: Controller, key: string, value: string, extraParams: IExtraParams[]): IGenericApiObject[] | undefined {
    const dataKey = this.generateKey(controller, key, value, extraParams);
    const data = this.cache.get(dataKey);
    if (data) {
      if (data.expired > Date.now()) {
        return data.data;
      }
    }

  }

  private generateKey(controller: Controller, key: string, value: string, extraParams: IExtraParams[]) {
    return `${controller.id}-${key}-${value}-${extraParams.map(param => `${param.key}+${param.value}`).join('.')}`;
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
