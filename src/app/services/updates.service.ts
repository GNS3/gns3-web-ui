import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class UpdatesService {
  constructor(private httpClient: HttpClient) {}

  getLatestVersion() {
    return this.httpClient.get('http://update.gns3.net/');
  }
}
