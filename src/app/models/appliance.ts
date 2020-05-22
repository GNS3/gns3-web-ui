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
    kvm: string;
    ram: number;
}

export interface Images {
    hda_disk_image: string;
}

export interface Version {
    images: Images;
    name: string;
}

export interface Appliance {
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
    qemu: Qemu;
    registry_version: number;
    status: string;
    symbol: string;
    usage: string;
    vendor_name: string;
    vendor_url: string;
    versions: Version[];
}
