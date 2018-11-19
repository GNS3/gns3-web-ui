import { DataSource } from "./datasource";

class Item {
  constructor(public id: string, public property1?: string, public property2?: string) {}
}


class TestDataSource extends DataSource<Item> {
  protected getItemKey(item: Item) {
    return item.id;
  };
}


describe('TestDataSource', () => {
  let dataSource: TestDataSource;
  let data: Item[];

  beforeEach(() => {
    dataSource = new TestDataSource();
    dataSource.changes.subscribe((updated: Item[]) => {
      data = updated;
    });
  });

  describe('Item can be added', () => {
    beforeEach(() => {
      dataSource.add(new Item("test1", "property1"));
    });

    it('item should be in data', () => {
      expect(data).toEqual([new Item("test1", "property1")]);
    });
  });


  describe('Item can be added when key duplocates', () => {
    beforeEach(() => {
      dataSource.add(new Item("test1", "property1"));
      dataSource.add(new Item("test1", "property2"));
    });

    it('item should be in data', () => {
      expect(data).toEqual([new Item("test1", "property2")]);
    });
  });

  describe('Items can be set', () => {
    beforeEach(() => {
      dataSource.set([new Item("test1", "property1"), new Item("test2", "property2")]);
    });

    it('items should be in data', () => {
      expect(data).toEqual([new Item("test1", "property1"), new Item("test2", "property2")]);
    });
  });

  describe('Items can be removed', () => {
    beforeEach(() => {
      dataSource.set([new Item("test1", "property1"), new Item("test2", "property2")]);
      dataSource.remove(new Item("test1", "property1"));
    });

    it('item should not be in data', () => {
      expect(data).toEqual([new Item("test2", "property2")]);
    });
  });

  describe('Item can be updated', () => {
    beforeEach(() => {
      dataSource.set([new Item("test1", "property1", "another"), new Item("test2", "property2")]);
      dataSource.update(new Item("test1", "property3"));
    });

    it('item should be updated', () => {
      expect(data).toEqual([
        new Item("test1", "property3"),
        new Item("test2", "property2")
      ]);
    });

  });

  describe('Items should be cleared', () => {
    beforeEach(() => {
      dataSource.set([new Item("test1", "property1", "another"), new Item("test2", "property2")]);
      dataSource.clear();
    });

    it('items should be cleared', () => {
      expect(data).toEqual([]);
    });

  });

});
