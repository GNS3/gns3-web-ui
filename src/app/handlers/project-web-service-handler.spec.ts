import { inject, TestBed } from '@angular/core/testing';

import { Subject } from 'rxjs';

import { ProjectWebServiceHandler, WebServiceMessage } from './project-web-service-handler';
import { NodesDataSource } from '../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../cartography/datasources/links-datasource';
import { DrawingsDataSource } from '../cartography/datasources/drawings-datasource';
import { Node } from '../cartography/models/node';
import { Link } from '../models/link';
import { Drawing } from '../cartography/models/drawing';

describe('ProjectWebServiceHandler', () => {
  let ws: Subject<WebServiceMessage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectWebServiceHandler, NodesDataSource, LinksDataSource, DrawingsDataSource]
    });

    ws = new Subject<WebServiceMessage>();
  });

  it('should be created', inject([ProjectWebServiceHandler], (service: ProjectWebServiceHandler) => {
    expect(service).toBeTruthy();
  }));

  it('node should be added', inject(
    [ProjectWebServiceHandler, NodesDataSource],
    (service: ProjectWebServiceHandler, nodesDataSource: NodesDataSource) => {
      spyOn(nodesDataSource, 'add');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'node.created';
      message.event = new Node();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(nodesDataSource.add).toHaveBeenCalledWith(message.event);
    }
  ));

  it('node should be updated', inject(
    [ProjectWebServiceHandler, NodesDataSource],
    (service: ProjectWebServiceHandler, nodesDataSource: NodesDataSource) => {
      spyOn(nodesDataSource, 'update');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'node.updated';
      message.event = new Node();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(nodesDataSource.update).toHaveBeenCalledWith(message.event);
    }
  ));

  it('node should be removed', inject(
    [ProjectWebServiceHandler, NodesDataSource],
    (service: ProjectWebServiceHandler, nodesDataSource: NodesDataSource) => {
      spyOn(nodesDataSource, 'remove');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'node.deleted';
      message.event = new Node();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(nodesDataSource.remove).toHaveBeenCalledWith(message.event);
    }
  ));

  it('link should be added', inject(
    [ProjectWebServiceHandler, LinksDataSource],
    (service: ProjectWebServiceHandler, linksDataSource: LinksDataSource) => {
      spyOn(linksDataSource, 'add');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'link.created';
      message.event = new Link();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(linksDataSource.add).toHaveBeenCalledWith(message.event);
    }
  ));

  it('link should be updated', inject(
    [ProjectWebServiceHandler, LinksDataSource],
    (service: ProjectWebServiceHandler, linksDataSource: LinksDataSource) => {
      spyOn(linksDataSource, 'update');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'link.updated';
      message.event = new Link();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(linksDataSource.update).toHaveBeenCalledWith(message.event);
    }
  ));

  it('link should be removed', inject(
    [ProjectWebServiceHandler, LinksDataSource],
    (service: ProjectWebServiceHandler, linksDataSource: LinksDataSource) => {
      spyOn(linksDataSource, 'remove');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'link.deleted';
      message.event = new Link();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(linksDataSource.remove).toHaveBeenCalledWith(message.event);
    }
  ));

  it('drawing should be added', inject(
    [ProjectWebServiceHandler, DrawingsDataSource],
    (service: ProjectWebServiceHandler, drawingsDataSource: DrawingsDataSource) => {
      spyOn(drawingsDataSource, 'add');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'drawing.created';
      message.event = new Drawing();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(drawingsDataSource.add).toHaveBeenCalledWith(message.event);
    }
  ));

  it('drawing should be updated', inject(
    [ProjectWebServiceHandler, DrawingsDataSource],
    (service: ProjectWebServiceHandler, drawingsDataSource: DrawingsDataSource) => {
      spyOn(drawingsDataSource, 'update');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'drawing.updated';
      message.event = new Drawing();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(drawingsDataSource.update).toHaveBeenCalledWith(message.event);
    }
  ));

  it('drawing should be removed', inject(
    [ProjectWebServiceHandler, DrawingsDataSource],
    (service: ProjectWebServiceHandler, drawingsDataSource: DrawingsDataSource) => {
      spyOn(drawingsDataSource, 'remove');

      service.connect(ws);

      const message = new WebServiceMessage();
      message.action = 'drawing.deleted';
      message.event = new Drawing();

      ws.next(message);

      expect(service).toBeTruthy();
      expect(drawingsDataSource.remove).toHaveBeenCalledWith(message.event);
    }
  ));
});
