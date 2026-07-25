import { Injectable } from '@angular/core';

export type InterfaceDensity = 'normal' | 'compact';

@Injectable()
export class InterfaceDensityService {
  private readonly storageKey = 'gns3_interface_density';

  getDensity(): InterfaceDensity {
    const stored = localStorage.getItem(this.storageKey);
    if (stored === 'normal' || stored === 'compact') {
      return stored;
    }
    return 'normal';
  }

  setDensity(density: InterfaceDensity): void {
    localStorage.setItem(this.storageKey, density);
  }
}
