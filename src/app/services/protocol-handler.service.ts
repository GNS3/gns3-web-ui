import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ToasterService } from './toaster.service';
import { ElectronService } from './electron.service';
import { LoginService } from './login.service';
import { ControllerService } from './controller.service';

@Injectable()
export class ProtocolHandlerService {

  constructor(
    private toasterService: ToasterService,
    private deviceService: DeviceDetectorService,
    private electronService: ElectronService,
    private loginService: LoginService,
    private controllerService: ControllerService
  ) {}

  createHiddenIframe(target: Element, uri: string) {
    const iframe = document.createElement("iframe");
    iframe.src = uri;
    iframe.id = "hiddenIframe";
    iframe.style.display = "none";
    target.appendChild(iframe);
    return iframe;
  }

  openUriUsingFirefox(uri: string) {
      var iframe = (document.querySelector("#hiddenIframe") as HTMLIFrameElement);

      if (!iframe) {
          iframe = this.createHiddenIframe(document.body, "about:blank");
      }

      try {
          iframe.contentWindow.location.href = uri;
      } catch (e) {
          if (e.name === "NS_ERROR_UNKNOWN_PROTOCOL") {
              this.toasterService.error('Protocol handler does not exist');
          }
      }
  }

  async open(uri: string) {

    // Check if running in Electron and handle gns3+pcap:// protocol
    if (this.electronService.isElectron() && uri.startsWith('gns3+pcap://')) {
      console.log('[ProtocolHandler] Running in Electron, handling gns3+pcap:// protocol');

      try {
        // Parse URL: gns3+pcap://host:port?protocol=xxx&project_id=xxx&link_id=xxx&project=xxx&name=xxx
        const url = new URL(uri.replace('gns3+pcap://', 'http://'));

        // Get current controller for auth token
        const controller = await this.controllerService.get(parseInt(this.loginService.controller_id, 10));

        const config = {
          host: url.hostname,
          port: parseInt(url.port),
          protocol: url.searchParams.get('protocol') || 'http',
          projectId: url.searchParams.get('project_id'),
          linkId: url.searchParams.get('link_id'),
          captureName: url.searchParams.get('name'),
          authToken: controller?.authToken
        };

        console.log('[ProtocolHandler] Downloading and opening capture:', config);

        // Use ElectronService to download and open in Wireshark
        this.electronService.downloadAndOpenCapture(config).subscribe(result => {
          if (result.success) {
            console.log('[ProtocolHandler] Capture opened successfully');
            this.toasterService.success('Wireshark launched');
          } else {
            console.error('[ProtocolHandler] Failed to open capture');
            this.toasterService.error('Failed to open Wireshark');
          }
        });

        return; // Don't proceed to default handler
      } catch (error) {
        console.error('[ProtocolHandler] Error handling gns3+pcap://:', error);
        // Fall through to default handler
      }
    }

    // Default browser behavior
    const device = this.deviceService.getDeviceInfo();

    console.log("Launching external protocol handler with " + device.browser + ": " + uri)
    if (device.browser === "Firefox") {
      // Use a hidden iframe otherwise Firefox will disconnect
      // from the GNS3 controller websocket if we use location.assign()
      this.openUriUsingFirefox(uri);
    } else {
      location.assign(uri);
    }
  }
}
