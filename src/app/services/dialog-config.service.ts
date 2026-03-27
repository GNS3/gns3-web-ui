import { Injectable } from '@angular/core';

export interface DialogConfig {
  panelClass?: string | string[];
  width?: string;
  maxWidth?: string;
  maxHeight?: string;
  autoFocus?: boolean;
  disableClose?: boolean;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class DialogConfigService {
  private configs: Map<string, DialogConfig> = new Map();

  constructor() {
    this.registerDefaultConfigs();
  }

  private registerDefaultConfigs(): void {
    // Base dialog - common styles for all dialogs
    const baseConfig: DialogConfig = {
      panelClass: ['base-dialog-panel'],
    };

    // Configurator dialog - main config pages (800px, tabs, cards)
    const configuratorConfig: DialogConfig = {
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
      width: '800px',
      maxWidth: '800px',
      maxHeight: '80vh',
    };

    // Simple dialog - sub dialogs like Image Creator (500px)
    const simpleConfig: DialogConfig = {
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      width: '500px',
      maxWidth: '500px',
      maxHeight: '80vh',
    };

    // Change Symbol Dialog - inherits configurator
    this.configs.set('changeSymbol', {
      ...configuratorConfig,
      panelClass: [
        'base-dialog-panel',
        'configurator-dialog-panel',
        'change-symbol-dialog-panel',
      ],
    });

    // Template Symbol Dialog - inherits configurator (same styling as change symbol)
    this.configs.set('templateSymbol', {
      ...configuratorConfig,
      panelClass: [
        'base-dialog-panel',
        'configurator-dialog-panel',
        'change-symbol-dialog-panel',
      ],
    });

    // Symbols Manager Dialog - inherits configurator (800px width)
    this.configs.set('symbolsManager', {
      ...configuratorConfig,
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
    });

    // Confirmation Dialog
    this.configs.set('confirmation', {
      panelClass: ['confirmation-dialog-panel'],
    });

    // Edit Controller Dialog
    this.configs.set('editController', {
      ...baseConfig,
      panelClass: ['base-dialog-panel', 'edit-controller-dialog-panel'],
    });

    // Add Controller Dialog
    this.configs.set('addController', {
      ...baseConfig,
      panelClass: ['base-dialog-panel', 'add-controller-dialog-panel'],
    });

    // Custom Adapters Dialog
    this.configs.set('customAdapters', {
      panelClass: ['base-dialog-panel', 'custom-adapters-dialog-panel'],
      width: '1000px',
      maxWidth: '1000px',
    });

    // Edit Project Dialog
    this.configs.set('editProject', {
      ...configuratorConfig,
      panelClass: [
        'base-dialog-panel',
        'configurator-dialog-panel',
        'edit-project-dialog-panel',
      ],
      width: '700px',
      maxWidth: '700px',
      maxHeight: '600px',
    });

    // Add ACE Dialog
    this.configs.set('addAce', {
      ...configuratorConfig,
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel', 'add-ace-dialog-panel'],
      width: '1000px',
      maxWidth: '1000px',
    });

    // New Template Dialog
    this.configs.set('newTemplate', {
      ...configuratorConfig,
      panelClass: [
        'base-dialog-panel',
        'configurator-dialog-panel',
        'new-template-dialog-panel',
      ],
    });

    // Nodes Menu Confirmation Dialog
    this.configs.set('nodesMenuConfirmation', {
      ...simpleConfig,
      panelClass: [
        'base-dialog-panel',
        'simple-dialog-panel',
        'nodes-menu-confirmation-dialog-panel',
      ],
      width: '500px',
      maxWidth: '500px',
      maxHeight: '200px',
    });

    // Start Capture Dialog - simple dialog (500px)
    this.configs.set('startCapture', {
      ...simpleConfig,
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
    });

    // Link Style Editor Dialog - simple dialog (500px)
    this.configs.set('linkStyleEditor', {
      ...simpleConfig,
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
    });

    // Packet Filters Dialog - simple dialog (500px)
    this.configs.set('packetFilters', {
      ...simpleConfig,
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
    });

    // Help Dialog - simple dialog (500px)
    this.configs.set('helpDialog', {
      ...simpleConfig,
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
    });
  }

  getConfig(name: string): DialogConfig {
    const config = this.configs.get(name);
    if (!config) {
      console.warn(`DialogConfigService: No config found for "${name}", using base config`);
      return { panelClass: ['base-dialog-panel'] };
    }
    return { ...config };
  }

  openConfig(name: string, overrides?: Partial<DialogConfig>): DialogConfig {
    const baseConfig = this.getConfig(name);
    if (overrides) {
      return { ...baseConfig, ...overrides };
    }
    return baseConfig;
  }

  registerConfig(name: string, config: DialogConfig): void {
    this.configs.set(name, config);
  }
}
