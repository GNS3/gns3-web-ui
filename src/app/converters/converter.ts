export interface Converter<TSource, TDestination> {
  convert(from: TSource): TDestination;
}
