import { Injectable } from '@angular/core';

@Injectable()
export class IosConfigurationService {

  c2600_nms = ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW'];
  c3600_nms = ['NM-1FE-TX', 'NM-1E', 'NM-4E', 'NM-16ESW', 'NM-4T'];
  c3700_nms = ['NM-1FE-TX', 'NM-4T', 'NM-16ESW'];
  c7200_pas = ['PA-A1', 'PA-FE-TX', 'PA-2FE-TX', 'PA-GE', 'PA-4T+', 'PA-8T', 'PA-4E', 'PA-8E', 'PA-POS-OC3'];
  c7200_io = ['C7200-IO-FE', 'C7200-IO-2FE', 'C7200-IO-GE-E'];

  c1700_wics = ['WIC-1T', 'WIC-2T', 'WIC-1ENET'];
  c2600_wics = ['WIC-1T', 'WIC-2T'];
  c3700_wics = ['WIC-1T', 'WIC-2T'];

  getConsoleTypes() {
    return ['telnet', 'none'];
  }

  getCategories() {
    let categories = [
      ['Default', 'guest'],
      ['Routers', 'router'],
      ['Switches', 'switch'],
      ['End devices', 'guest'],
      ['Security devices', 'firewall'],
    ];

    return categories;
  }

  getDefaultRamSettings() {
    return {
      c1700: 160,
      c2600: 160,
      c2691: 192,
      c3600: 192,
      c3725: 128,
      c3745: 256,
      c7200: 512,
    };
  }

  getDefaultNvRamSettings() {
    return {
      c1700: 128,
      c2600: 128,
      c2691: 256,
      c3600: 256,
      c3725: 256,
      c3745: 256,
      c7200: 512,
    };
  }

  getAvailablePlatforms() {
    return ['c1700', 'c2600', 'c2691', 'c3725', 'c3745', 'c3600', 'c7200'];
  }

  getPlatformsWithEtherSwitchRouterOption() {
    return {
      c1700: false,
      c2600: true,
      c2691: true,
      c3725: true,
      c3745: true,
      c3600: true,
      c7200: false,
    };
  }

  getPlatformsWithChassis() {
    return {
      c1700: true,
      c2600: true,
      c2691: false,
      c3725: false,
      c3745: false,
      c3600: true,
      c7200: false,
    };
  }

  getChassis() {
    return {
      c1700: ['1720', '1721', '1750', '1751', '1760'],
      c2600: ['2610', '2611', '2620', '2621', '2610XM', '2611XM', '2620XM', '2621XM', '2650XM', '2651XM'],
      c3600: ['3620', '3640', '3660'],
    };
  }

  getNPETypes() {
    return ['npe-100', 'npe-150', 'npe-175', 'npe-200', 'npe-225', 'npe-300', 'npe-400', 'npe-g2'];
  }

  getMidplaneTypes() {
    return ['std', 'vxr'];
  }

  getAdapterMatrix() {

    let adapter_matrix: any = {};
    for (let platform of ["c1700", "c2600", "c2691", "c3725", "c3745", "c3600", "c7200"]) {
      adapter_matrix[platform] = {};
    }

    // 1700s have one interface on the MB, 2 sub-slots for WICs, and no NM slots
    for (let chassis of ["1720", "1721", "1750", "1751", "1760"]) {
      adapter_matrix["c1700"][chassis] = { 0: ["C1700-MB-1FE"] };
    }

    // Add a fake NM in slot 1 on 1751s and 1760s to provide two WIC slots
    for (let chassis of ["1751", "1760"]) {
      adapter_matrix["c1700"][chassis][1] = ["C1700-MB-WIC1"];
    }

    // 2600s have one or more interfaces on the MB, 2 subslots for WICs, and an available NM slot 1
    for (let chassis of ["2620", "2610XM", "2620XM", "2650XM"]) {
      adapter_matrix["c2600"][chassis] = { 0: ["C2600-MB-1FE"], 1: this.c2600_nms };
    }

    for (let chassis of ["2621", "2611XM", "2621XM", "2651XM"]) {
      adapter_matrix["c2600"][chassis] = { 0: ["C2600-MB-2FE"], 1: this.c2600_nms };
    }

    adapter_matrix["c2600"]["2610"] = { 0: ["C2600-MB-1E"], 1: this.c2600_nms };
    adapter_matrix["c2600"]["2611"] = { 0: ["C2600-MB-2E"], 1: this.c2600_nms };

    // 2691s have two FEs on the motherboard and one NM slot
    adapter_matrix["c2691"][""] = { 0: ["GT96100-FE"], 1: this.c3700_nms };

    // 3620s have two generic NM slots
    adapter_matrix["c3600"]["3620"] = {};
    for (let slot = 0; slot < 2; slot++) {
      adapter_matrix["c3600"]["3620"][slot] = this.c3600_nms;
    }

    // 3640s have four generic NM slots
    adapter_matrix["c3600"]["3640"] = {};
    for (let slot = 0; slot < 4; slot++) {
      adapter_matrix["c3600"]["3640"][slot] = this.c3600_nms;
    }

    // 3660s have 2 FEs on the motherboard and 6 generic NM slots
    adapter_matrix["c3600"]["3660"] = { 0: ["Leopard-2FE"] };
    for (let slot = 1; slot < 7; slot++) {
      adapter_matrix["c3600"]["3660"][slot] = this.c3600_nms;
    }

    // 3725s have 2 FEs on the motherboard and 2 generic NM slots
    adapter_matrix["c3725"][""] = { 0: ["GT96100-FE"] };
    for (let slot = 1; slot < 3; slot++) {
      adapter_matrix["c3725"][""][slot] = this.c3700_nms;
    }

    // 3745s have 2 FEs on the motherboard and 4 generic NM slots
    adapter_matrix["c3745"][""] = { 0: ["GT96100-FE"] };
    for (let slot = 1; slot < 5; slot++) {
      adapter_matrix["c3745"][""][slot] = this.c3700_nms;
    }

    // 7206s allow an IO controller in slot 0, and a generic PA in slots 1-6
    adapter_matrix["c7200"][""] = { 0: this.c7200_io };
    for (let slot = 1; slot < 7; slot++) {
      adapter_matrix["c7200"][""][slot] = this.c7200_pas;
    }

    return adapter_matrix;
  }

  getWicMatrix() {
    let wic_matrix: any = {};

    wic_matrix["c1700"] = { 0: this.c1700_wics, 1: this.c1700_wics };
    wic_matrix["c2600"] = { 0: this.c2600_wics, 1: this.c2600_wics, 2: this.c2600_wics };
    wic_matrix["c2691"] = { 0: this.c3700_wics, 1: this.c3700_wics, 2: this.c3700_wics };
    wic_matrix["c3725"] = { 0: this.c3700_wics, 1: this.c3700_wics, 2: this.c3700_wics };
    wic_matrix["c3745"] = { 0: this.c3700_wics, 1: this.c3700_wics, 2: this.c3700_wics };
    return wic_matrix;
  }

  getIdlepcRegex() {
    return /^(0x[0-9a-fA-F]+)?$|^$/;
  }

  getMacAddrRegex() {
    return /^([0-9a-fA-F]{4}\.){2}[0-9a-fA-F]{4}$|^$/;
  }
}
