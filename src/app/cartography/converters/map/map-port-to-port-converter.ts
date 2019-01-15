import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { Port } from '../../../models/port';
import { MapPort } from '../../models/map/map-port';

@Injectable()
export class MapPortToPortConverter implements Converter<MapPort, Port> {
  convert(mapPort: MapPort) {
    const port = new Port();
    port.adapter_number = mapPort.adapterNumber;
    port.link_type = mapPort.linkType;
    port.name = mapPort.name;
    port.port_number = mapPort.portNumber;
    port.short_name = mapPort.shortName;
    return port;
  }
}
