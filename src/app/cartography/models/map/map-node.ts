import { MapLabel } from "./map-label";
import { MapPort } from "./map-port";
import { Indexed } from "../../datasources/map-datasource";

export class MapNode implements Indexed {
    id: string;
    commandLine: string;
    computeId: string;
    console: number;
    consoleHost: string;
    consoleType: string;
    firstPortName: string;
    height: number;
    label: MapLabel;
    name: string;
    nodeDirectory: string;
    nodeType: string;
    portNameFormat: string;
    portSegmentSize: number;
    ports: MapPort[];
    projectId: string;
    status: string;
    symbol: string;
    width: number;
    x: number;
    y: number;
    z: number;
    isSelected = false;
}
