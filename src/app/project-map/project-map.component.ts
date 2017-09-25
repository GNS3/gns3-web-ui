import {Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Subject } from "rxjs/Subject";

import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/dom/webSocket';


import { Project } from '../models/project';
import { Node } from '../models/node';
import { SymbolService } from '../services/symbol.service';
import { Link } from "../models/link";
import { MapComponent } from "../map/map.component";
import { ServerService } from "../services/server.service";
import { ProjectService } from '../services/project.service';
import { Server } from "../models/server";


@Component({
  selector: 'app-project-map',
  templateUrl: './project-map.component.html',
  styleUrls: ['./project-map.component.css'],
})
export class ProjectMapComponent implements OnInit {
  public nodes: Node[] = [];
  public links: Link[] = [];

  project: Project;
  server: Server;

  private ws: Subject<any>;

  @ViewChild(MapComponent) mapChild: MapComponent;

  constructor(
              private route: ActivatedRoute,
              private serverService: ServerService,
              private projectService: ProjectService,
              private symbolService: SymbolService) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      const server_id = parseInt(paramMap.get('server_id'), 10);
      Observable
        .fromPromise(this.serverService.get(server_id))
        .flatMap((server: Server) => {
          this.server = server;
          return this.projectService.get(server, paramMap.get('project_id'));
        })
        .flatMap((project: Project) => {
          this.project = project;

          if (this.project.status === 'opened') {
            return new Observable((observer) => {
              observer.next(this.project);
            });
          } else {
            return this.projectService.open(
              this.server, this.project.project_id);
          }
        })
        .subscribe((project: Project) => {
          this.onProjectLoad(project);
        });
    });
  }

  onProjectLoad(project: Project) {
    this.symbolService
      .load(this.server)
      .flatMap(() => {
        return this.projectService.links(this.server, project.project_id);
      })
      .flatMap((links: Link[]) => {
        this.links = links;
        return this.projectService.nodes(this.server, project.project_id);
      })
      .subscribe((nodes: Node[]) => {
        this.nodes = nodes;

        nodes.forEach((n: Node) => {
          n.icon = this.symbolService.get(n.symbol);
        });

        this.setUpWS(project);
      });

  }

  setUpWS(project: Project) {
    this.ws = Observable.webSocket(
      this.projectService.notificationsPath(this.server, project.project_id));

    this.ws.subscribe((o: any) => {
      if (o.action === 'node.updated') {
        const node: Node = o.event;
        const index = this.nodes.findIndex((n: Node) => n.node_id === node.node_id);
        if (index >= 0) {
          this.nodes[index] = node;
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'node.created') {
        const node: Node = o.event;
        const index = this.nodes.findIndex((n: Node) => n.node_id === node.node_id);
        if (index === -1) {
          this.nodes.push(node);
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'node.deleted') {
        const node: Node = o.event;
        const index = this.nodes.findIndex((n: Node) => n.node_id === node.node_id);
        if (index >= 0) {
          this.nodes.splice(index, 1);
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'link.created') {
        const link: Link = o.event;
        const index = this.links.findIndex((l: Link) => l.link_id === link.link_id);
        if (index === -1) {
          this.links.push(link);
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'link.updated') {
        const link: Link = o.event;
        const index = this.links.findIndex((l: Link) => l.link_id === link.link_id);
        if (index >= 0) {
          this.links[index] = link;
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'link.deleted') {
        const link: Link = o.event;
        const index = this.links.findIndex((l: Link) => l.link_id === link.link_id);
        if (index >= 0) {
          this.links.splice(index, 1);
          this.mapChild.reload(); // temporary invocation
        }
      }
    });
  }
}
