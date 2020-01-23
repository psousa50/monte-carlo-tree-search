import * as R from "ramda"

export const NO_PARENT = -1

type State = any
type Move = any

export interface Tree<S = State, M = Move> {
  config: Config<S, M>
  nodes: ReadonlyArray<Node>
}

export interface Node {
  children: ReadonlyArray<number>
  index: number
  move?: Move
  parentIndex: number
  state: State
  value: number
  visits: number
}

export interface Config<S = State, M = Move> {
  calcUcb: (tree: Tree) => (node: Node) => number
  strategy: Strategy<S, M>
}

export interface Strategy<S = State, M = Move> {
  availableMoves: (state: S) => ReadonlyArray<M>
  calcValue: (state: S) => number | undefined
  isFinal: (state: S) => boolean
  nextMove?: (state: S) => M | undefined
  nextState: (state: S, move: M) => S
}

interface TreeResult {
  tree: Tree
  value: number
}

const createNode = (
  state: State,
  index: number,
  parentIndex: number = NO_PARENT,
  move: Move | undefined = undefined,
) => ({
  children: [],
  index,
  move,
  parentIndex,
  state,
  value: 0,
  visits: 0,
})

const parentVisits = (tree: Tree) => (node: Node) => {
  const parent = getParent(tree)(node)
  return Math.max(parent ? parent.visits : 1, 1)
}

export const p = (...a: any) => {
  a.forEach((v: any) => console.log("=====>\n", JSON.stringify(v, null, 2)))
  return a[a.length - 1]
}

const sqrt2 = Math.sqrt(2)
export const calcUcb = (tree: Tree) => (node: Node) =>
  node.visits === 0
    ? Infinity
    : node.value / node.visits + sqrt2 * Math.sqrt(Math.log(parentVisits(tree)(node)) / node.visits)

const addChildNodes = (tree: Tree, node: Node) => {
  const {
    nodes,
    config: { strategy },
  } = tree
  const nodeIndex = nodes.length
  const childrenMoves = strategy.availableMoves(node.state)
  const children = childrenMoves.map((move, i) =>
    createNode(strategy.nextState(node.state, move), nodeIndex + i, node.index, move),
  )

  const nodeWithChildren = {
    ...node,
    children: children.map(c => c.index),
  }
  return {
    node: nodeWithChildren,
    tree: {
      ...tree,
      nodes: [...tree.nodes.map(n => (n.index === node.index ? nodeWithChildren : n)), ...children],
    },
  }
}

const isLeaf = (node: Node) => node.children.length === 0

const getNode = (tree: Tree) => (index: number) => tree.nodes[index]

export const getParent = (tree: Tree) => (node: Node) =>
  node.parentIndex === NO_PARENT ? undefined : getNode(tree)(node.parentIndex)

export const getRoot = (tree: Tree) => getNode(tree)(0)

export const getChildren = (tree: Tree) => (node: Node) => node.children.map(getNode(tree))

const replaceNode = (tree: Tree) => (nodeIndex: number, update: (node: Node) => Node) => ({
  ...tree,
  nodes: tree.nodes.map(n => (n.index === nodeIndex ? update(n) : n)),
})

export const createTree = (config: Config) => (initialState: State): Tree => ({
  config,
  nodes: [createNode(initialState, 0)],
})

const nextRandomMove = ({ config: { strategy} }: Tree) => (state: State) => {
  const moves = strategy.availableMoves(state)
  return moves[Math.floor(Math.random() * moves.length)]
}

const selectBestUcbNode = (tree: Tree, node: Node): Node => {
  const { config } = tree

  const childNodes = getChildren(tree)(node)

  const firstNode = childNodes[0]
  const bestUcbNode = childNodes.reduce(
    (acc, cur) => {
      const ucb = config.calcUcb(tree)(cur)
      return ucb > acc.bestUcb ? { bestNode: cur, bestUcb: ucb } : acc
    },
    { bestNode: firstNode, bestUcb: config.calcUcb(tree)(firstNode) },
  )

  return bestUcbNode.bestNode
}

const expand = (tree: Tree, node: Node) => {
  const r = isLeaf(node) ? addChildNodes(tree, node) : { tree, node }
  return visit(r.tree, r.node)
}

const rolloutValue = (tree: Tree) => (state: State): number => {
  const { config: { strategy} } = tree

  const nextMove = strategy.nextMove ? strategy.nextMove(state) : nextRandomMove(tree)(state)
  return nextMove
    ? rolloutValue(tree)(strategy.nextState(state, nextMove))
    : strategy.calcValue(state) || 0
}

const rollout = (tree: Tree) => (state: State): TreeResult => ({
  tree,
  value: rolloutValue(tree)(state),
})

// const backPropagate = (tree: Tree) => (value: number, node?: Node): Tree =>
//   node
//     ? backPropagate(replaceNode(tree)({ ...node, value: node.value + value, visits: node.visits + 1 }))(
//         value,
//         getParent(tree)(node),
//       )
//     : tree

const visit = (tree: Tree, node: Node): TreeResult => {
  const { config: { strategy} } = tree

  const bestUcbNode = selectBestUcbNode(tree, node)

  const newTreeResult = strategy.isFinal(bestUcbNode.state)
    ? {
        tree,
        value: strategy.calcValue(bestUcbNode.state) || 0,
      }
    : bestUcbNode.visits === 0
    ? rollout(tree)(bestUcbNode.state)
    : expand(tree, bestUcbNode)

  const updatedTree = replaceNode(newTreeResult.tree)(bestUcbNode.index, n => ({
    ...n,
    value: n.value + newTreeResult.value,
    visits: n.visits + 1,
  }))

  // console.log("UPDATED TREE=====>\n", JSON.stringify(updatedTree, null, 2))

  return {
    tree: updatedTree,
    value: newTreeResult.value,
  }
}

export const findBestNodeIteration = (tree: Tree) => visit(tree, tree.nodes[0])

export const findBestNode2 =  (tree: Tree, iterations: number) => {
  const newTreeResult = R.range(1, iterations + 1).reduce(
    acc => {
      const r = findBestNodeIteration(acc.tree)
      const newTree = replaceNode(r.tree)(getRoot(r.tree).index, n => ({
        ...n,
        value: n.value + r.value,
        visits: n.visits + 1,
      }))
      return {
        tree: newTree,
        value: r.value,
      }
    },
    { tree, value: 0 },
  )

  const children = getChildren(newTreeResult.tree)(getRoot(newTreeResult.tree))
  const maxValue = R.reduce(
    R.max,
    -Infinity,
    children.map(c => c.value),
  )
  return { tree: newTreeResult.tree, node: children.find(c => c.value === maxValue)! }
}

export const findBestNode = (tree: Tree, iterations: number = 100) =>
  findBestNode2(addChildNodes(tree, getRoot(tree)).tree, iterations)
