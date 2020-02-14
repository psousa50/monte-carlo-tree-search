import * as R from "ramda"

export const maxNumber = (coll: number[]) => R.reduce(R.max, -Infinity, coll)

export const maxNumberBy = <T>(coll: T[], f: (item: T) => number) =>
  coll.length === 0 ? undefined : coll.reduce((acc, cur) => (f(cur) > f(acc) ? cur : acc), coll[0])
