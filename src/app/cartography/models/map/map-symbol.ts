import { Indexed } from '../../datasources/map-datasource';

export class MapSymbol implements Indexed {
  id: string;
  builtin: boolean;
  filename: string;
  raw: string;
}
