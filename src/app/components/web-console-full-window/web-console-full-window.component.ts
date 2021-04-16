import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Node } from '../../cartography/models/node';
import { Server } from '../../models/server';
import { NodeService } from '../../services/node.service';
import { NodeConsoleService } from '../../services/nodeConsole.service';
import { ServerService } from '../../services/server.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-web-console-full-window',
  templateUrl: './web-console-full-window.component.html',
  styleUrls: ['../../../../node_modules/xterm/css/xterm.css'],
})
export class WebConsoleFullWindowComponent implements OnInit {
  private serverId: string;
  private projectId: string;
  private nodeId: string;
  private subscriptions: Subscription = new Subscription();
  private server: Server;
  private node: Node;

  public term: Terminal = new Terminal();
  public fitAddon: FitAddon = new FitAddon();

  @ViewChild('terminal') terminal: ElementRef;

  constructor(
    private consoleService: NodeConsoleService,
    private serverService: ServerService,
    private route: ActivatedRoute,
    private title: Title,
    private nodeService: NodeService
  ) {}

  ngOnInit() {
    if (this.serverService.isServiceInitialized) {
      this.getData();
    } else {
      this.subscriptions.add(
        this.serverService.serviceInitialized.subscribe((val) => {
          if (val) this.getData();
        })
      );
    }
  }

  getData() {
    this.serverId = this.route.snapshot.paramMap.get('server_id');
    this.projectId = this.route.snapshot.paramMap.get('project_id');
    this.nodeId = this.route.snapshot.paramMap.get('node_id');

    this.consoleService.consoleResized.subscribe((ev) => {
      this.fitAddon.fit();
    });

    this.serverService.get(+this.serverId).then((server: Server) => {
      this.server = server;
      this.nodeService.getNodeById(this.server, this.projectId, this.nodeId).subscribe((node: Node) => {
        this.node = node;
        this.title.setTitle(this.node.name);
        this.openTerminal();
      });
    });
  }

  openTerminal() {
    setTimeout(() => {
      this.term.open(this.terminal.nativeElement);
      const socket = new WebSocket(this.consoleService.getUrl(this.server, this.node));

      socket.onerror = (event) => {
        this.term.write('Connection lost' + '\r\n');
      };
      socket.onclose = (event) => {
        this.term.write('Connection closed' + '\r\n');
      };

      const attachAddon = new AttachAddon(socket);
      this.term.loadAddon(attachAddon);
      this.term.setOption('cursorBlink', true);
      this.term.loadAddon(this.fitAddon);
      this.fitAddon.activate(this.term);
      this.fitAddon.fit();
      this.term.focus();

      this.term.attachCustomKeyEventHandler((key: KeyboardEvent) => {
        if (key.code === 'KeyC' || key.code === 'KeyV') {
          if (key.ctrlKey) {
            return false;
          }
        }
        return true;
      });

      let numberOfColumns = Math.round(window.innerWidth / this.consoleService.getLineWidth());
      let numberOfRows = Math.round(window.innerHeight / this.consoleService.getLineHeight());
      this.term.resize(numberOfColumns, numberOfRows);
    }, 0);
  }
}
