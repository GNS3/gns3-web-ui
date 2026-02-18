export class MockedGraphDataManager {
  private nodes = [];
  private links = [];
  private drawings = [];
  private symbols = [];

  public setNodes(value) {
    this.nodes = value;
  }

  public getNodes() {
    return this.nodes;
  }

  public setLinks(value) {
    this.links = value;
  }

  public getLinks() {
    return this.links;
  }

  public setDrawings(value) {
    this.drawings = value;
  }

  public getDrawings() {
    return this.drawings;
  }

  public setSymbols(value) {
    this.symbols = value;
  }

  public getSymbols() {
    return this.symbols;
  }
}
