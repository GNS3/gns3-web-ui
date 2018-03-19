import {DataSource} from "./datasource";

class TestDataSource extends DataSource<string> {
  protected findIndex(item: string) {
    return this.data.findIndex((i: string) => i === item);
  }
};


describe('TestDataSource', () => {
  let dataSource: TestDataSource;
  let data: string[];

  beforeEach(() => {
    dataSource = new TestDataSource();
    dataSource.connect().subscribe((updated: string[]) => {
      data = updated;
    });
  });

  describe('Item can be added', () => {
    beforeEach(() => {
      dataSource.add("test");
    });

    it('item should be in data', () => {
      expect(data).toEqual(["test"]);
    });
  });

  describe('Items can be set', () => {
    beforeEach(() => {
      dataSource.set(["test", "test2"]);
    });

    it('items should be in data', () => {
      expect(data).toEqual(["test", "test2"]);
    });
  });

  describe('Items can be removed', () => {
    beforeEach(() => {
      dataSource.set(["test", "test2"]);
      dataSource.remove("test");
    });

    it('item should not be in data', () => {
      expect(data).toEqual(["test2"]);
    });
  });

  describe('Item can be updated', () => {
    beforeEach(() => {
      dataSource.set(["test", "test2"]);
      dataSource.update("test");
    });

    it('item should be updated', () => {
      expect(data).toEqual(["test", "test2"]);
    });
  });

});
