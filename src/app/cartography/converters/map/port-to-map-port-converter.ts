import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { Port } from '../../../models/port';
import { MapPort } from '../../models/map/map-port';

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
