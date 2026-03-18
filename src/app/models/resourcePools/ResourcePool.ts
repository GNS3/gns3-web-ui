import {Resource} from "@models/resourcePools/Resource";

export class ResourcePool {
  name: string;
  created_at: string;
  updated_at: string;
  resource_pool_id: string;
  resources?: Resource[];
}
