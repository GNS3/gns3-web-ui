import{ Controller } from '../models/controller';

export function getTestController():Controller  {
  const controller = new Controller  ();
  controller.host = '127.0.0.1';
  controller.port = 3080;
  controller.protocol = 'http:';
  return controller;
}
