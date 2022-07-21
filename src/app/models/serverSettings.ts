import { Builtin } from './controller-settings-models/builtin';
import { Docker } from './controller-settings-models/docker';
import { Dynamips } from './controller-settings-models/dynamips';
import { GraphicsView } from './controller-settings-models/graphics-view';
import { IOU } from './controller-settings-models/iou';
import { Qemu } from './controller-settings-models/qemu';
import { VirtualBox } from './controller-settings-models/virtual-box';
import { VMware } from './controller-settings-models/vmware';
import { VPCS } from './controller-settings-models/vpcs';

export class ServerSettings {
  Builtin: Builtin;
  Docker: Docker;
  Dynamips: Dynamips;
  Graphicsview: GraphicsView;
  IOU: IOU;
  Qemu: Qemu;
  VMware: VMware;
  VPCS: VPCS;
  VirtualBox: VirtualBox;
  modification_uuid: string;
}
