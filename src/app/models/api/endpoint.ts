export enum RessourceType {
  project = "project",
  node = "node",
  link = "link",
  user = "user",
  group = "group",
  pool = "pool",
  image = "image",
  template = "template",
  root = "root"
}

export interface Endpoint {
  endpoint: string,
  name: string,
  endpoint_type: RessourceType
}
