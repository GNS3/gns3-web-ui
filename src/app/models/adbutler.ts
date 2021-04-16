export interface Placement1 {
  banner_id: string;
  width: string;
  height: string;
  alt_text: string;
  accompanied_html: string;
  target: string;
  tracking_pixel: string;
  body: string;
  redirect_url: string;
  refresh_url: string;
  refresh_time: string;
  image_url: string;
}

export interface Placements {
  placement_1: Placement1;
}

export interface AdButlerResponse {
  status: string;
  placements: Placements;
}
