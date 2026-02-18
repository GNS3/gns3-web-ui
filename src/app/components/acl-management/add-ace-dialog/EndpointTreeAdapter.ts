import {Endpoint, RessourceType} from "@models/api/endpoint";

export interface EndpointNode {
  endpoint: string;
  name: string;
  endpoint_type: RessourceType;
  depth: number;
  splitEndp: string[];
  parent?: string[];
  children?: EndpointNode[];
}

export class EndpointTreeAdapter {
  private endpoints: Endpoint[]

  constructor(endpoints: Endpoint[]) {
    this.endpoints = endpoints
  }

  buildTreeFromEndpoints(): EndpointNode[] {
    const parentNode: EndpointNode[] = []
    let nodes = []
    this.endpoints.forEach((endp: Endpoint) => {
      const node = this.extractParent(endp)
      nodes.push(node)
    })

    nodes.forEach((node: EndpointNode) => {
        if(node.depth > 0) {
          const parent = nodes.filter((n: EndpointNode) => n.splitEndp.join('/') == node.splitEndp.slice(0, node.depth-1).join('/'))[0]
          parent.children.push(node)
        }
      })

    parentNode.push(nodes.find((node: EndpointNode) => node.depth === 0))

    return parentNode
  }

  private extractParent(endp: Endpoint): EndpointNode {

    let splitEndp = endp.endpoint.split('/');
    splitEndp = splitEndp.filter((value: string) => value !== '' && value !== 'access')
    let parent = [];
    if (splitEndp.length > 0) {
      parent = splitEndp.slice(0,splitEndp.length - 1)
    }
    const node: EndpointNode = {
      children: [],
      depth: splitEndp.length,
      splitEndp: splitEndp,
      endpoint: endp.endpoint,
      endpoint_type: endp.endpoint_type,
      name: endp.name,
      parent: parent
    }
    return node
  }
}
