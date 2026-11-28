import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Controller } from '@models/controller';
import { StartupMediaProfile } from '@models/startup-media-profile';
import { startupMediaProfileFitsDevice } from '@services/configuration-capabilities';
import { StartupMediaProfilesService } from '@services/startup-media-profiles.service';

const CONSOLE_LABEL = 'Console (default)';

/**
 * "Startup configuration profile" select of the QEMU template and node editors.
 * '' is the console restore (stored as none); every other value is the id of a
 * boot media profile from the server catalog. Only profiles that fit the node's Netmiko device type
 * are offered, and a selected profile that stops fitting (the device type changed) is cleared.
 * When the catalog cannot be read the
 * current value is shown read-only with a short note; the editor stays usable.
 */
@Component({
  selector: 'app-startup-media-profile-select',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './startup-media-profile-select.component.html',
  styleUrl: './startup-media-profile-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartupMediaProfileSelectComponent {
  /** Profile id, '' for none. */
  readonly value = model('');
  readonly controller = input<Controller>(undefined);
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
  readonly disabled = input(false);
  /** Netmiko device type of the node or template; limits the profiles to its own appliance's. */
  readonly deviceType = input<string | null | undefined>(undefined);

  private readonly service = inject(StartupMediaProfilesService);

  readonly state = signal<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  readonly profiles = signal<StartupMediaProfile[]>([]);
  readonly available = computed(() =>
    this.profiles().filter((profile) => startupMediaProfileFitsDevice(profile.device_type, this.deviceType())),
  );

  readonly consoleLabel = CONSOLE_LABEL;
  /** The value is set but missing from the catalog (a profile of a newer server): keep it selectable. */
  readonly unlisted = computed(() => {
    const value = this.value();
    return value && !this.profiles().some((profile) => profile.id === value) ? value : '';
  });
  readonly readOnlyText = computed(() => this.value() || CONSOLE_LABEL);

  constructor() {
    effect((onCleanup) => {
      const controller = this.controller();
      this.profiles.set([]);
      if (!controller) {
        this.state.set('idle');
        return;
      }
      this.state.set('loading');
      const subscription = this.service.list(controller).subscribe({
        next: (profiles) => {
          this.profiles.set(profiles);
          this.state.set('ready');
        },
        error: () => this.state.set('unavailable'),
      });
      onCleanup(() => subscription.unsubscribe());
    });
    effect(() => {
      // Never keep a profile of another appliance than the device type (a profile unknown to the catalog is kept).
      const value = this.value();
      if (
        value &&
        this.profiles().some((profile) => profile.id === value) &&
        !this.available().some((profile) => profile.id === value)
      ) {
        this.value.set('');
      }
    });
  }

  choose(id: string | null) {
    this.value.set(id || '');
  }
}
