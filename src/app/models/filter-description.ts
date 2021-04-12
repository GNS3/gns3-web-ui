export class FilterDescription {
  description: string;
  name: string;
  parameters: Parameter[];
  type: string;
}

interface Parameter {
  maximum?: number;
  minimum?: number;
  name: string;
  type: string;
  unit?: string;
}
