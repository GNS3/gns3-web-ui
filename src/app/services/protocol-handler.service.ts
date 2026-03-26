import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ToasterService } from './toaster.service';
import { LoginService } from './login.service';

@Injectable()
export class ProtocolHandlerService {
  constructor(
    private toasterService: ToasterService,
    private deviceService: DeviceDetectorService,
    private loginService: LoginService
  ) {}

  createHiddenIframe(target: Element, uri: string) {
    const iframe = document.createElement('iframe');
    iframe.src = uri;
    iframe.id = 'hiddenIframe';
    iframe.style.display = 'none';
    target.appendChild(iframe);
    return iframe;
  }

  openUriUsingFirefox(uri: string) {
    var iframe = document.querySelector('#hiddenIframe') as HTMLIFrameElement;

    if (!iframe) {
      iframe = this.createHiddenIframe(document.body, 'about:blank');
    }

    try {
      iframe.contentWindow.location.href = uri;
    } catch (e) {
      if (e.name === 'NS_ERROR_UNKNOWN_PROTOCOL') {
        this.toasterService.error('Protocol handler does not exist');
      }
    }
  }

  async open(uri: string) {
    // Default browser behavior
    const device = this.deviceService.getDeviceInfo();

    console.log('Launching external protocol handler with ' + device.browser + ': ' + uri);
    if (device.browser === 'Firefox') {
      // Use a hidden iframe otherwise Firefox will disconnect
      // from the GNS3 controller websocket if we use location.assign()
      this.openUriUsingFirefox(uri);
    } else {
      location.assign(uri);
    }
  }
}
