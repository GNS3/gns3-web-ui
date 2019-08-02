import { Injectable } from "@angular/core";
import { Subject } from 'rxjs';

@Injectable()
export class MapSettingService {
    public isMapLocked = new Subject<boolean>();

    constructor() {}

    changeMapLockValue(value: boolean) {
        this.isMapLocked.next(value);
    }
}
