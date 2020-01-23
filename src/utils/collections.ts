import * as R from "ramda"

export const maxNumber = (coll: number[]) => R.reduce(R.max, -Infinity, coll)
