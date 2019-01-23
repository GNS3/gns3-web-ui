export interface Widget {
  draw(view: any, datum: any): void;
}

export interface OnDraw {
  draw(view: any): void;
}

export interface OnConnect {
  onConnect(view: any): void;
}

export interface OnDisconnect {
  onDisconnect(view: any): void;
}
