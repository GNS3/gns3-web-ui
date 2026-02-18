export interface Converter<F, T> {
  convert(obj: F): T;
}
