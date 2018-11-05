import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Link } from "../../models/link";
import { SerialLinkWidget } from "./links/serial-link";
import { EthernetLinkWidget } from "./links/ethernet-link";
import { MultiLinkCalculatorHelper } from "../helpers/multi-link-calculator-helper";
import { InterfaceLabelWidget } from "./interface-label";
import { InterfaceStatusWidget } from "./interface-status";


@Injectable()
export class LinkWidget implements Widget {

  constructor(
    private multiLinkCalculatorHelper: MultiLinkCalculatorHelper,
    private interfaceLabelWidget: InterfaceLabelWidget,
    private interfaceStatusWidget: InterfaceStatusWidget
  ) {}

  public getInterfaceLabelWidget() {
    return this.interfaceLabelWidget;
  }

  public getInterfaceStatusWidget() {
    return this.interfaceStatusWidget;
  }

  public draw(view: SVGSelection) {
    const link_body = view.selectAll<SVGGElement, Link>("g.link_body")
      .data((l) => [l]);

    const link_body_enter = link_body.enter()
      .append<SVGGElement>('g')
      .attr("class", "link_body");

    const link_body_merge = link_body.merge(link_body_enter)
      .attr('transform', (link) => {
        const translation = this.multiLinkCalculatorHelper.linkTranslation(link.distance, link.source, link.target);
        return `translate (${translation.dx}, ${translation.dy})`;
      });

    const serial_link_widget = new SerialLinkWidget();
    serial_link_widget.draw(link_body_merge);

    const ethernet_link_widget = new EthernetLinkWidget();
    ethernet_link_widget.draw(link_body_merge);

    link_body_merge
      .select<SVGPathElement>('path')
        .classed('selected', (l: Link) => l.is_selected);

    this.getInterfaceLabelWidget().draw(link_body_merge);
    this.getInterfaceStatusWidget().draw(link_body_merge);

  }
}
