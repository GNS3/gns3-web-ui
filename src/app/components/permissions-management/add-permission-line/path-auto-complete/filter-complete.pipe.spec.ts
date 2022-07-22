import {FilterCompletePipe} from "@components/permissions-management/add-permission-line/path-auto-complete/filter-complete.pipe";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

describe('FilterCompletePipe', () => {
  it('should remove items which not match searchText', function () {
      const filter = new FilterCompletePipe();

      const items: IGenericApiObject[] = [
        {id: 'b2afe0da-b83e-42a8-bcb6-e46ca1bd1747', name: 'test project 1'},
        {id: '698d35c1-9fd0-4b89-86dc-336a958b1f70', name: 'test project 2'},
        {id: '4bbd57e6-bf99-4387-8948-7e7d8e96de9b', name: 'test project 3'},
        {id: '29e9ddb6-1ba0-422d-b767-92592821f011', name: 'test project 4'},
        {id: '5a522134-0bfd-4864-b8b3-520bcecd4fc9', name: 'test project 5'},
        {id: '7e27f67a-2b63-4d00-936b-e3d8c7e2b751', name: 'test project 6'},
      ];

      expect(filter.transform(items, 'test project 6'))
        .toEqual([{id: '7e27f67a-2b63-4d00-936b-e3d8c7e2b751', name: 'test project 6'}]);
  });


  it('should return entire list if searchText is empty', function () {
    const filter = new FilterCompletePipe();

    const items: IGenericApiObject[] = [
      {id: 'b2afe0da-b83e-42a8-bcb6-e46ca1bd1747', name: 'test project 1'},
      {id: '698d35c1-9fd0-4b89-86dc-336a958b1f70', name: 'test project 2'},
      {id: '4bbd57e6-bf99-4387-8948-7e7d8e96de9b', name: 'test project 3'},
      {id: '29e9ddb6-1ba0-422d-b767-92592821f011', name: 'test project 4'},
      {id: '5a522134-0bfd-4864-b8b3-520bcecd4fc9', name: 'test project 5'},
      {id: '7e27f67a-2b63-4d00-936b-e3d8c7e2b751', name: 'test project 6'},
    ];

    expect(filter.transform(items, '')).toEqual(items);
    expect(filter.transform(items, undefined)).toEqual(items);
  });
});
