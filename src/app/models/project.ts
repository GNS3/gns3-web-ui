export class Project {
  auto_close: boolean;
  auto_open: boolean;
  auto_start: boolean;
  drawing_grid_size: number;
  filename: string;
  grid_size: number;
  name: string;
  path: string;
  project_id: string;
  scene_height: number;
  scene_width: number;
  status: string;
  readonly: boolean;
  show_interface_labels: boolean;
  show_layers: boolean;
  show_grid: boolean;
  snap_to_grid: boolean;
  variables: ProjectVariable[];
}

export class ProjectVariable {
  name: string;
  value: string;
}
