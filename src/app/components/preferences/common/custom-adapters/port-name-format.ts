/**
 * Port name prediction mirroring gns3-server's StandardPortFactory
 * (gns3-server/gns3server/controller/ports/port_factory.py).
 *
 * The server walks the adapter list keeping two counters:
 * - when first_port_name is set, adapter 0 gets that literal name and does
 *   NOT consume an interface number (the next adapter formats with 0)
 * - every other adapter is named by formatting port_name_format with:
 *   {0} interface number, {1} segment number, {adapter} adapter number,
 *   {portN} / {segmentN} = interface / segment number + N (N: 0-8)
 * - with port_segment_size > 0 the interface number wraps at the segment
 *   size and the segment number increments per boundary; otherwise both
 *   counters equal the adapter index
 */
export interface PortNamingContext {
  portNameFormat?: string;
  portSegmentSize?: number;
  firstPortName?: string;
}

const PORT_NAME_PLACEHOLDER = /\{(?:[01]|adapter|port[0-8]|segment[0-8])\}/g;

export function computeDefaultPortName(adapterNumber: number, context: PortNamingContext): string {
  if (context.firstPortName && adapterNumber === 0) {
    return context.firstPortName;
  }
  const format = context.portNameFormat || 'Ethernet{0}';
  const segmentSize = context.portSegmentSize || 0;
  const interfaceIndex = adapterNumber - (context.firstPortName ? 1 : 0);
  const interfaceNumber = segmentSize > 0 ? interfaceIndex % segmentSize : interfaceIndex;
  const segmentNumber = segmentSize > 0 ? Math.floor(interfaceIndex / segmentSize) : interfaceIndex;

  return evaluatePortNameFormat(format, interfaceNumber, segmentNumber, adapterNumber);
}

export function evaluatePortNameFormat(
  format: string,
  interfaceNumber: number,
  segmentNumber: number,
  adapterNumber: number,
): string {
  return format.replace(PORT_NAME_PLACEHOLDER, (token) => {
    const inner = token.slice(1, -1);
    if (inner === '0') return String(interfaceNumber);
    if (inner === '1') return String(segmentNumber);
    if (inner === 'adapter') return String(adapterNumber);
    if (inner.startsWith('port')) return String(interfaceNumber + Number(inner.slice(4)));
    return String(segmentNumber + Number(inner.slice(7)));
  });
}
