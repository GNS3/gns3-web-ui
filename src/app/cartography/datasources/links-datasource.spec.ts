import { LinksDataSource } from './links-datasource';
import { Link } from '../../models/link';

describe('LinksDataSource', () => {
  let dataSource: LinksDataSource;
  let data: Link[];

  beforeEach(() => {
    dataSource = new LinksDataSource();
    dataSource.changes.subscribe((links: Link[]) => {
      data = links;
    });
  });

  describe('Link can be updated', () => {
    beforeEach(() => {
      const link = new Link();
      link.link_id = '1';
      link.project_id = 'project-1';
      dataSource.add(link);

      link.project_id = 'project-2';
      dataSource.update(link);
    });

    it('project_id should change', () => {
      expect(data[0].link_id).toEqual('1');
      expect(data[0].project_id).toEqual('project-2');
    });
  });
});
