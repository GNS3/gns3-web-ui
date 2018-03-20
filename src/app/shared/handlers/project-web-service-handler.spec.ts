import {ProjectWebServiceHandler, WebServiceMessage} from "./project-web-service-handler";
import {Subject} from "rxjs/Subject";
import {inject, TestBed} from "@angular/core/testing";
import {NodesDataSource} from "../../cartography/shared/datasources/nodes-datasource";
import {LinksDataSource} from "../../cartography/shared/datasources/links-datasource";
import {Node} from "../../cartography/shared/models/node";
import {Link} from "../../cartography/shared/models/link";



describe('ProjectWebServiceHandler', () => {
  let ws: Subject<WebServiceMessage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectWebServiceHandler, NodesDataSource, LinksDataSource]
    });

    ws = new Subject<WebServiceMessage>();
  });

  it('should be created', inject([ProjectWebServiceHandler], (service: ProjectWebServiceHandler) => {
    expect(service).toBeTruthy();
  }));

  it('node should be added', inject([ProjectWebServiceHandler, NodesDataSource],
    (service: ProjectWebServiceHandler, nodesDataSource: NodesDataSource) => {
    spyOn(nodesDataSource, 'add');

    service.connect(ws);

    const message = new WebServiceMessage();
    message.action = "node.created";
    message.event = new Node();

    ws.next(message);

    expect(service).toBeTruthy();
    expect(nodesDataSource.add).toHaveBeenCalledWith(message.event);
  }));

  it('node should be updated', inject([ProjectWebServiceHandler, NodesDataSource],
    (service: ProjectWebServiceHandler, nodesDataSource: NodesDataSource) => {
    spyOn(nodesDataSource, 'update');

    service.connect(ws);

    const message = new WebServiceMessage();
    message.action = "node.updated";
    message.event = new Node();

    ws.next(message);

    expect(service).toBeTruthy();
    expect(nodesDataSource.update).toHaveBeenCalledWith(message.event);
  }));


  it('node should be removed', inject([ProjectWebServiceHandler, NodesDataSource],
    (service: ProjectWebServiceHandler, nodesDataSource: NodesDataSource) => {
    spyOn(nodesDataSource, 'remove');

    service.connect(ws);

    const message = new WebServiceMessage();
    message.action = "node.deleted";
    message.event = new Node();

    ws.next(message);

    expect(service).toBeTruthy();
    expect(nodesDataSource.remove).toHaveBeenCalledWith(message.event);
  }));

  it('link should be added', inject([ProjectWebServiceHandler, LinksDataSource],
    (service: ProjectWebServiceHandler, linksDataSource: LinksDataSource) => {
    spyOn(linksDataSource, 'add');

    service.connect(ws);

    const message = new WebServiceMessage();
    message.action = "link.created";
    message.event = new Link();

    ws.next(message);

    expect(service).toBeTruthy();
    expect(linksDataSource.add).toHaveBeenCalledWith(message.event);
  }));

  it('link should be updated', inject([ProjectWebServiceHandler, LinksDataSource],
    (service: ProjectWebServiceHandler, linksDataSource: LinksDataSource) => {
    spyOn(linksDataSource, 'update');

    service.connect(ws);

    const message = new WebServiceMessage();
    message.action = "link.updated";
    message.event = new Link();

    ws.next(message);

    expect(service).toBeTruthy();
    expect(linksDataSource.update).toHaveBeenCalledWith(message.event);
  }));


  it('link should be removed', inject([ProjectWebServiceHandler, LinksDataSource],
    (service: ProjectWebServiceHandler, linksDataSource: LinksDataSource) => {
    spyOn(linksDataSource, 'remove');

    service.connect(ws);

    const message = new WebServiceMessage();
    message.action = "link.deleted";
    message.event = new Link();

    ws.next(message);

    expect(service).toBeTruthy();
    expect(linksDataSource.remove).toHaveBeenCalledWith(message.event);
  }));
});
