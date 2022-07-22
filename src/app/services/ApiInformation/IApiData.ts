import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

export interface IApiData {
  expired: number;
  data: IGenericApiObject[];
}
