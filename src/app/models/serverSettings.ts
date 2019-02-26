import { Builtin } from './server-settings-models/builtin';
import { Docker } from './server-settings-models/docker';
import { Dynamips } from './server-settings-models/dynamips';
import { GraphicsView } from './server-settings-models/graphics-view';
import { IOU } from './server-settings-models/iou';
import { Qemu } from './server-settings-models/qemu';
import { VMware } from './server-settings-models/vmware';
import { VPCS } from './server-settings-models/vpcs';
import { VirtualBox } from './server-settings-models/virtual-box';

export class ServerSettings {
    Builtin: Builtin;
    Docker: Docker;
    Dynamips: Dynamips;
    Graphicsview: GraphicsView;
    IOU: IOU;
    Qemu: Qemu;
    VMware: VMware;
    VPCS: VPCS;
    VirtualBox:  VirtualBox;
    modification_uuid: string
}
