import {ApiInformationService, IApiObject} from "@services/ApiInformation/api-information.service";
import {Server} from "@models/server";
import {IExtraParams} from "@services/ApiInformation/IExtraParams";
import {forkJoin, Observable, of} from "rxjs";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";
import {map} from "rxjs/operators";

export class GetObjectIdHelper {

  public static getIdNameFromKey(key: string): string {
    return /{([^)]+)}/.exec(key)[1];
  }

  public static findElementInObjectListFn(key): (data: IApiObject[]) => IApiObject {
    return function findElement(data: IApiObject[]): IApiObject {
      const elem = data.find(d => d.name === key);
      if (!elem) {
        throw new Error('entry not found');
      }
      return elem;
    };
  }

  public static buildRequestURL(server: Server, value: string, extraParams: IExtraParams[]): (elem) => string {
    return (elem): string => {
      let url = `${server.protocol}//${server.host}:${server.port}${elem.path}`;
      if (extraParams) {
        extraParams.forEach((param) => {
          url = url.replace(param.key, param.value);
        });
      }

      if (value) {
        url = `${url}/${value}`;
      }
      return url;
    };
  }

  public static createResponseObject(key: string,
                                     extraParams: IExtraParams[],
                                     service: ApiInformationService,
                                     server: Server
  ): (response) => Observable<IGenericApiObject[]> {

    const idName = key ? GetObjectIdHelper.getIdNameFromKey(key) : undefined;
    return (response): Observable<IGenericApiObject[]> => {

      if (!(response instanceof Array)) {
        response = [response];
      }
      if (response.length === 0) {
        return of([]);
      }

      /*
      specific treatment for link_id
       */
      if (key === '{link_id}') {
        return GetObjectIdHelper.setLinkObjectInformation(response, extraParams, service, server);
      } else {
        return GetObjectIdHelper.setGenericObjectInformation(response, idName);
      }
    };
  }

  private static setGenericObjectInformation(response: any[], idName: string): Observable<IGenericApiObject[]> {
    const keys = Object.keys(response[0]);
    const idKey = keys.find(k => k.match(/_id$|filename/));
    const nameKey = keys.find(k => k.match(/name/));
    response = response.map(o => {
      return {
        id: o[idName] || o[idKey],
        name: o[nameKey]
      };
    });
    return of(response);
  }

  private static setLinkObjectInformation(links: any[],
                                          extraParams: IExtraParams[],
                                          service: ApiInformationService,
                                          server: Server
  ): Observable<IGenericApiObject[]> {

    return forkJoin(links.map(link => GetObjectIdHelper.getLinkInformation(link, extraParams, service, server)));
  }

  private static getLinkInformation(link: any,
                                    extraParams: IExtraParams[],
                                    service: ApiInformationService,
                                    server: Server
  ): Observable<IGenericApiObject> {

    const nodesDataObs = link.nodes.map(node => service.getListByObjectId(server, '{node_id}', node.node_id, extraParams));
    return forkJoin(nodesDataObs)
      .pipe(map((nodes: [any]) => {
        const name = nodes
          .reduce((acc, val) => acc.concat(val), [])
          .map(node => node.name)
          .join(' <-> ');

        return {id: link.link_id, name};
      }));
  }
}
