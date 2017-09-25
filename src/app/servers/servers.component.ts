import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Server } from "../models/server";
import { ServerService } from "../services/server.service";


@Component({
  selector: 'app-server-create-modal',
  templateUrl: './server-create-modal.component.html'
})
export class ServerCreateModalComponent {
  public server = new Server();

  constructor(public activeModal: NgbActiveModal) {}

  add() {
    this.activeModal.close(this.server);
  }
}


@Component({
  selector: 'app-server-list',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.css']
})
export class ServersComponent implements OnInit {
  servers: Server[] = [];

  constructor(private modalService: NgbModal, private serverService: ServerService) { }

  ngOnInit() {
    this.loadServers();
  }

  loadServers() {
    this.serverService.findAll().then((servers: Server[]) => {
      this.servers = servers;
    });
  }

  createModal() {
    this.modalService.open(ServerCreateModalComponent).result.then((server: Server) => {
      this.serverService.create(server).then((created: Server) => {
        this.loadServers();
      });
    }, (rejection) => {
    });
  }

  deleteServer(server: Server) {
    this.serverService.delete(server).then(() => {
      this.loadServers();
    });
  }

}
