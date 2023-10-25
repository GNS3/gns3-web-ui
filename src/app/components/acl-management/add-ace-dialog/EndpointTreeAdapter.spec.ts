import {EndpointTreeAdapter} from "@components/acl-management/add-ace-dialog/EndpointTreeAdapter";
import {Endpoint, RessourceType} from "@models/api/endpoint";

const endpoint1: Endpoint = {
  endpoint: "/",
  endpoint_type: RessourceType.image,
  name: "Root"
}

const endpoint2: Endpoint = {
  endpoint: "/projects",
  endpoint_type: RessourceType.project,
  name: "All projects"

}

const endpoint3: Endpoint = {
  endpoint: "/images",
  endpoint_type: RessourceType.image,
  name: "All images"

}

const endpoint4: Endpoint = {
  endpoint: "/projects/blabla",
  endpoint_type: RessourceType.project,
  name: "Project blabla"

}

const endpoint5 : Endpoint = {
  endpoint: "/projects/blabla/nodes",
  endpoint_type: RessourceType.node,
  name: "All nodes for project blabla"
}

const endpoint6 : Endpoint = {
  endpoint: "/images/blabla",
  endpoint_type: RessourceType.image,
  name: "Image blabla"
}


let endpoints: Endpoint[] = [endpoint1, endpoint2, endpoint3, endpoint4, endpoint5, endpoint6];

describe('EndpointTreeAdapter', () => {

  it('Should build endpointTree', () => {

    const adapter = new EndpointTreeAdapter(endpoints);
    const tree = adapter.buildTreeFromEndpoints()
    expect(tree.length).toEqual(1);
    expect(tree[0].children.length).toEqual(2);

    const projectEndpoint = tree[0].children[0];

    expect(projectEndpoint.children.length).toEqual(1);
    expect(projectEndpoint.children[0].children.length).toEqual(1);

    const imageEndpoint = tree[0].children[0];
    expect(imageEndpoint.children.length).toEqual(1)
    expect(imageEndpoint.children[0].children.length).toEqual(1);
  });

  it('Should build empty tree', () => {
    const adapter = new EndpointTreeAdapter([]);
    const tree = adapter.buildTreeFromEndpoints()

    expect(tree.length).toEqual(1);
  })
})
