import { browser } from 'protractor';

export class TestHelper {
  sleep(value: number) {
    browser.sleep(value);
  }

  waitForLoading() {
    browser.waitForAngular();
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  getCurrentUrl() {
    return browser.getCurrentUrl();
  }
}
