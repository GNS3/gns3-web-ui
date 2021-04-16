export type SoftwareType = 'web';

export class Software {
  name: string;
  locations: string[];
  type: SoftwareType;
  resource: string;
  binary: string;
  sudo: boolean;
  installation_arguments: string[];
  installed: boolean;
}
