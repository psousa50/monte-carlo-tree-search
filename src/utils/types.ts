
interface DeepPartialArray2<T> extends Array<DeepPartial<T>> {}

type DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> }

// tslint:disable-next-line: ban-types
export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? DeepPartialArray2<U>
  : T extends object
  ? DeepPartialObject<T>
  : T | undefined
