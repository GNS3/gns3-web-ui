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

export type DialogSize = 'small' | 'medium' | 'large' | 'extra-large';

@Injectable({ providedIn: 'root' })
export class DialogConfigService {
  private configs: Map<string, DialogConfig> = new Map();

  constructor() {
    this.registerDefaultConfigs();
  }

  sizeConfig(size: DialogSize): DialogConfig {
    return {
      panelClass: ['base-dialog-panel', `dialog-${size}-panel`],
      autoFocus: false,
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
    };
  }

  private registerDefaultConfigs(): void {
    // Small: confirmations and short, single-purpose forms.
    const smallConfig = this.sizeConfig('small');

    // Medium: editors, selectors, and multi-section forms.
    const mediumConfig = this.sizeConfig('medium');

    // Large: wide editors and tables that do not need the full management workspace.
    const largeConfig = this.sizeConfig('large');

    // Extra large: management/detail workflows with tabs, tables, or dense forms.
    const extraLargeConfig = this.sizeConfig('extra-large');

    // Base dialogs default to the safest small category.
    const baseConfig: DialogConfig = {
      ...smallConfig,
    };

    // Legacy aliases remain during migration; the category class owns sizing.
    const configuratorConfig: DialogConfig = {
      ...largeConfig,
      panelClass: ['base-dialog-panel', 'dialog-large-panel', 'configurator-dialog-panel'],
    };

    const simpleConfig: DialogConfig = {
      ...mediumConfig,
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'simple-dialog-panel'],
    };

    // Change Symbol Dialog - inherits configurator
    this.configs.set('changeSymbol', {
      ...configuratorConfig,
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'change-symbol-dialog-panel'],
    });

    // Template Symbol Dialog - inherits configurator (same styling as change symbol)
    this.configs.set('templateSymbol', {
      ...configuratorConfig,
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'change-symbol-dialog-panel'],
    });

    // Symbols Manager Dialog - large asset-management workspace.
    this.configs.set('symbolsManager', {
      ...configuratorConfig,
      panelClass: ['base-dialog-panel', 'dialog-large-panel', 'configurator-dialog-panel'],
    });

    // Confirmation Dialog
    this.configs.set('confirmation', {
      ...smallConfig,
      panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-danger-panel'],
    });

    // Edit Controller Dialog
    this.configs.set('editController', {
      ...baseConfig,
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'edit-controller-dialog-panel'],
    });

    // Add Controller Dialog
    this.configs.set('addController', {
      ...baseConfig,
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'add-controller-dialog-panel'],
    });

    // Custom Adapters Dialog - extra-large (1040px) adapter grid.
    this.configs.set('customAdapters', {
      ...extraLargeConfig,
      panelClass: ['base-dialog-panel', 'dialog-extra-large-panel', 'custom-adapters-dialog-panel'],
    });

    // Edit Project Dialog - large multi-section form.
    this.configs.set('editProject', {
      ...configuratorConfig,
      panelClass: ['base-dialog-panel', 'dialog-large-panel', 'edit-project-dialog-panel'],
    });

    // Add ACE Dialog - extra-large (1040px) rule editor.
    this.configs.set('addAce', {
      ...configuratorConfig,
      panelClass: ['base-dialog-panel', 'dialog-extra-large-panel', 'add-ace-dialog-panel'],
    });

    // Start Capture Dialog - simple dialog (medium, 720px)
    this.configs.set('startCapture', {
      ...simpleConfig,
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'simple-dialog-panel'],
    });

    // Link Style Editor Dialog - short single-purpose editor.
    this.configs.set('linkStyleEditor', {
      ...smallConfig,
      panelClass: ['base-dialog-panel', 'dialog-small-panel', 'simple-dialog-panel'],
    });

    // Packet Filters Dialog - medium two-column editor.
    this.configs.set('packetFilters', {
      ...mediumConfig,
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'simple-dialog-panel'],
    });

    // Help Dialog - simple dialog (medium, 720px)
    this.configs.set('helpDialog', {
      ...simpleConfig,
      panelClass: ['base-dialog-panel', 'dialog-medium-panel', 'simple-dialog-panel'],
    });
  }

  getConfig(name: string): DialogConfig {
    const config = this.configs.get(name);
    if (!config) {
      console.warn(`DialogConfigService: No config found for "${name}", using base config`);
      return this.sizeConfig('small');
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
