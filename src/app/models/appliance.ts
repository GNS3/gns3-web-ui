export interface Image {
    download_url: string;
    filename: string;
    filesize: any;
    md5sum: string;
    version: string;
}

export interface Qemu {
    adapter_type: string;
    adapters: number;
    arch: string;
    boot_priority: string;
    console_type: string;
    hda_disk_interface: string;
    hdb_disk_interface: string;
    hdc_disk_interface: string;
    hdd_disk_interface: string;
    kvm: string;
    ram: number;
}

export interface Docker {
    adapters: number;
    console_type: string;
    image: string;
}

export interface Dynamips {
    chassis: string;
    nvram: number;
    platform: string;
    ram: number;
    slot0: string;
    slot1: string;
    slot2: string;
    slot3: string;
    slot4: string;
    slot5: string;
    slot6: string;
    slot7: string;
    startup_config: string;
}

export interface Iou {
    ethernet_adapters: number;
    nvram: number;
    ram: number;
    serial_adapters: number;
    startup_config: string;
}

export interface Images {
    hda_disk_image: string;
    hdb_disk_image: string;
}

export interface Version {
    images: Images;
    name: string;
}

export interface Appliance {
    availability: string;
    builtin: boolean;
    category: string;
    description: string;
    documentation_url: string;
    first_port_name: string;
    images: Image[];
    maintainer: string;
    maintainer_email: string;
    name: string;
    port_name_format: string;
    product_name: string;
    product_url: string;
    registry_version: number;
    status: string;
    symbol: string;
    usage: string;
    vendor_name: string;
    vendor_url: string;
    versions: Version[];

    docker: Docker;
    dynamips: Dynamips;
    iou: Iou;
    qemu: Qemu;

    emulator?: string;
}
