import { NodesDataSource } from './nodes-datasource';
import { Node } from '../models/node';

describe('NodesDataSource', () => {
  let dataSource: NodesDataSource;
  let data: Node[];

  beforeEach(() => {
    dataSource = new NodesDataSource();
    dataSource.changes.subscribe((nodes: Node[]) => {
      data = nodes;
    });
  });

  describe('Node can be updated', () => {
    beforeEach(() => {
      const node = new Node();
      node.node_id = '1';
      node.name = 'Node 1';
      dataSource.add(node);

      node.name = 'Node 2';
      dataSource.update(node);
    });

    it('name should change', () => {
      expect(data[0].node_id).toEqual('1');
      expect(data[0].name).toEqual('Node 2');
    });
  });
});
