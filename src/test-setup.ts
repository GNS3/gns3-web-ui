/**
 * Global test setup for Angular 21 Zoneless + Vitest
 *
 * This file sets up global test configuration for Zoneless applications.
 * Reference: https://angular.dev/guide/testing
 *
 * NOTE: When using @angular/build:unit-test, TestBed initialization
 * is handled automatically. This file is used for additional setup only.
 */

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

// @angular/build:unit-test 已自动初始化 TestBed 环境
// 只需配置全局 providers
TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()],
});

console.log('✓ Test setup loaded for Angular 21 Zoneless testing');
