import { browser, by, element } from 'protractor';

export class TestHelper {
    sleep(value: number) {
        browser.sleep(value);
    }
}
