export interface Gns3vm {
  enable: boolean;
  engine: string;
  headless: boolean;
  port: number;
  ram: number;
  vcpus: number;
  vmname: string;
  when_exit: string;
}
