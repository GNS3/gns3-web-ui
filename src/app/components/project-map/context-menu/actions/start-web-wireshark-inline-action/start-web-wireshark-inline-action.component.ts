import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';

@Component({
  selector: 'app-start-web-wireshark-inline-action',
  templateUrl: './start-web-wireshark-inline-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartWebWiresharkInlineActionComponent {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  @Output() openWebWiresharkInline = new EventEmitter<{ link: Link; controller: Controller; project: Project }>();

  onOpenWebWiresharkInline() {
    const ctrl = this.controller();
    const proj = this.project();
    const linkItem = this.link();

    if (!ctrl || !proj || !linkItem) {
      return;
    }

    // Emit event to parent component to open inline window
    this.openWebWiresharkInline.emit({
      link: linkItem,
      controller: ctrl,
      project: proj,
    });
  }
}
