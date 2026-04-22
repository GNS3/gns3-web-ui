/**
 * @deprecated LEGACY COMPONENT - DO NOT USE
 *
 * This component is a leftover from the Electron desktop application removal.
 * Electron support was removed in commit b5bfb767.
 *
 * The "Open File Explorer" feature was Electron-specific and relied on Node.js
 * APIs to open the native file browser. This functionality is not available in
 * pure web mode due to browser security restrictions.
 *
 * TODO: Remove this component and its test files when convenient.
 * - Remove component files (open-file-explorer-action.component.ts/html)
 * - Remove test file (open-file-explorer-action.component.spec.ts)
 * - Remove import and declaration from app.module.ts
 */

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';

@Component({
  selector: 'app-open-file-explorer-action',
  templateUrl: './open-file-explorer-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenFileExplorerActionComponent {
  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  open() {
    // Opening file explorer is not supported in web mode
    console.log('Opening file explorer is only supported in Electron mode');
  }
}
