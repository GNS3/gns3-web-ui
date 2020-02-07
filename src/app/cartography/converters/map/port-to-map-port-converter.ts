import { Injectable } from '@angular/core';

import { Port } from '../../../models/port';
import { MapPort } from '../../models/map/map-port';
import { Converter } from '../converter';

@Injectable()
export class PortToMapPortConverter implements Converter<Port, MapPort> {
  convert(port: Port) {
    const mapPort = new MapPort();
    mapPort.adapterNumber = port.adapter_number;
    mapPort.linkType = port.link_type;
    mapPort.name = port.name;
    mapPort.portNumber = port.port_number;
    mapPort.shortName = port.short_name;
    return mapPort;
  }
}
