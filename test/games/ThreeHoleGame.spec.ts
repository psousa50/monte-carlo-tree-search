import * as ThreeHoleGame from "../../src/games/ThreeHoleGame"

describe("ThreeHoleGame", () => {
  it("creates a game", () => {
    expect(ThreeHoleGame.create()).toEqual({
      holes: [".", ".", "."],
      player: "X",
    })
  })

  it("availableMoves", () => {
    const game = ThreeHoleGame.create()

    expect(ThreeHoleGame.availableMoves(game)).toEqual([
      {
        player: "X",
        position: 0,
      },
      {
        player: "X",
        position: 1,
      },
      {
        player: "X",
        position: 2,
      },
    ])
  })

  describe("move", () => {
    it("first player", () => {
      const game = ThreeHoleGame.move(ThreeHoleGame.create(), { piece: "X", position: 2 })

      expect(game).toEqual({
        holes: [".", ".", "X"],
        player: "O",
      })
    })

    it("second player", () => {
      const game = ThreeHoleGame.move(ThreeHoleGame.move(ThreeHoleGame.create(), { piece: "X", position: 2 }), {
        piece: "O",
        position: 0,
      })

      expect(game).toEqual({
        holes: ["O", ".", "X"],
        player: "X",
      })
    })
  })

  describe("when middle hole", () => {
    it("is filled then game is final", () => {
      expect(
        ThreeHoleGame.isFinal(ThreeHoleGame.move(ThreeHoleGame.create(), { piece: "X", position: 1 })),
      ).toBeTruthy()
    })

    it("is not filled then game is not final", () => {
      expect(ThreeHoleGame.isFinal(ThreeHoleGame.move(ThreeHoleGame.create(), { piece: "X", position: 0 }))).toBeFalsy()
    })
  })

  describe("nextMove", () => {
    it("returns first move", () => {
      expect(ThreeHoleGame.nextMove(ThreeHoleGame.create())).toEqual({
        player: "X",
        position: 0,
      })
    })

    it("returns undefined if no move is available", () => {
      expect(
        ThreeHoleGame.nextMove(
          ThreeHoleGame.move(
            ThreeHoleGame.move(ThreeHoleGame.move(ThreeHoleGame.create(), { piece: "X", position: 0 }), {
              piece: "X",
              position: 1,
            }),
            { piece: "X", position: 2 },
          ),
        ),
      ).toBeUndefined()
    })
  })
})
