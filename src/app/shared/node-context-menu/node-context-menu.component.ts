import {ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatMenuTrigger} from "@angular/material";
import {DomSanitizer} from "@angular/platform-browser";


@Component({
  selector: 'app-node-context-menu',
  templateUrl: './node-context-menu.component.html',
  styleUrls: ['./node-context-menu.component.scss']
})
export class NodeContextMenuComponent implements OnInit {
  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  private topPosition;
  private leftPosition;

  constructor(protected sanitizer: DomSanitizer, protected changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    this.setPosition(0, 0);
  }

  public setPosition(top: number, left: number) {
    this.topPosition = this.sanitizer.bypassSecurityTrustStyle(top + "px");
    this.leftPosition = this.sanitizer.bypassSecurityTrustStyle(left + "px");
    this.changeDetector.detectChanges();
  }

  public open(top: number, left: number) {
    this.setPosition(top, left);
    this.contextMenu.openMenu();
  }

}
