import { Injectable } from '@angular/core';
import { Node } from '../cartography/models/node';

import 'rxjs/add/operator/map';
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";
import {Port} from "../models/port";

@Injectable()
export class LinkService {


  constructor(
    private httpServer: HttpServer) {}

  createLink(
    server: Server, source_node: Node, source_port: Port, target_node: Node, target_port: Port) {
    return this.httpServer
      .post(
        server,
        `/projects/${source_node.project_id}/links`,
        {"nodes": [
          {
            node_id: source_node.node_id,
            port_number: source_port.port_number,
            adapter_number: source_port.adapter_number
          },
          {
            node_id: target_node.node_id,
            port_number: target_port.port_number,
            adapter_number: target_port.adapter_number
          }
        ]});
  }

}
