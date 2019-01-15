import { Label } from './label';
import { Port } from '../../models/port';

export class Node {
  command_line: string;
  compute_id: string;
  console: number;
  console_host: string;
  console_type: string;
  first_port_name: string;
  height: number;
  label: Label;
  name: string;
  node_directory: string;
  node_id: string;
  node_type: string;
  port_name_format: string;
  port_segment_size: number;
  ports: Port[];
  project_id: string;
  status: string;
  symbol: string;
  symbol_url: string; // @TODO: full URL to symbol, move to MapNode once converters are moved to app module
  width: number;
  x: number;
  y: number;
  z: number;
}
