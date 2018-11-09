import { DrawingsDataSource } from "./drawings-datasource";
import { MapDrawing } from "../models/drawing";


describe('DrawingsDataSource', () => {
  let dataSource: DrawingsDataSource;
  let data: MapDrawing[];

  beforeEach(() => {
    dataSource = new DrawingsDataSource();
    dataSource.changes.subscribe((drawings: MapDrawing[]) => {
      data = drawings;
    });
  });

  describe('Drawing can be updated', () => {
    beforeEach(() => {
      const drawing = new MapDrawing();
      drawing.drawing_id = "1";
      drawing.project_id = "project1";
      dataSource.add(drawing);

      drawing.project_id = "project2";
      dataSource.update(drawing);
    });

    it('project_id should change', () => {
      expect(data[0].drawing_id).toEqual("1");
      expect(data[0].project_id).toEqual("project2");
    });
  });

});
