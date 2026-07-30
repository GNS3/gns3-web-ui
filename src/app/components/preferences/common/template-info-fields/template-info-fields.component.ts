import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-template-info-fields',
  templateUrl: './template-info-fields.component.html',
  styleUrl: './template-info-fields.component.scss',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateInfoFieldsComponent {
  readonly usage = model('');
  readonly symbol = model('computer');

  readonly symbolOptions = [
    { value: 'computer', icon: 'computer', label: 'Computer' },
    { value: 'vpcs_guest', icon: 'desktop_windows', label: 'VPCS' },
    { value: 'qemu_guest', icon: 'desktop_windows', label: 'Virtual machine' },
    { value: 'docker_guest', icon: 'deployed_code', label: 'Container' },
    { value: 'router', icon: 'router', label: 'Router' },
    { value: 'multilayer_switch', icon: 'hub', label: 'Switch' },
    { value: 'ethernet_switch', icon: 'settings_ethernet', label: 'Ethernet switch' },
    { value: 'hub', icon: 'device_hub', label: 'Hub' },
    { value: 'cloud', icon: 'cloud', label: 'Cloud' },
  ];
}
