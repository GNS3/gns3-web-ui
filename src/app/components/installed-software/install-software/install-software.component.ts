import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-install-software',
  templateUrl: './install-software.component.html',
  styleUrls: ['./install-software.component.scss'],
  imports: [CommonModule, MatButtonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class InstallSoftwareComponent implements OnInit, OnDestroy, OnChanges {
  @Input('software')
  software: any;

  @Output()
  installedChanged = new EventEmitter();

  readonly disabled = signal(false);
  readonly readyToInstall = signal(true);
  readonly buttonText = signal('');

  constructor() {}

  ngOnInit() {
    this.updateButton();
  }

  ngOnDestroy() {}

  ngOnChanges() {
    this.updateButton();
  }

  install() {
    // Installation is not supported in web mode
    this.disabled.set(true);
    this.buttonText.set('Not supported');
  }

  private updateButton() {
    this.disabled.set(this.software.installed);

    if (this.software.installed) {
      this.buttonText.set('Installed');
    } else {
      this.buttonText.set('Install');
    }
  }
}
