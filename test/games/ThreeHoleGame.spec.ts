import * as ThreeHoleGame from "../../src/games/ThreeHoleGame/game"

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
        piece: "X",
        position: 0,
      },
      {
        piece: "X",
        position: 1,
      },
      {
        piece: "X",
        position: 2,
      },
    ])
  })

  describe("move", () => {
    it("first move", () => {
      const game = ThreeHoleGame.move(ThreeHoleGame.create(), { piece: "X", position: 2 })

      expect(game).toEqual({
        holes: [".", ".", "X"],
        player: "O",
      })
    })

    it("second move", () => {
      const game = ThreeHoleGame.move(ThreeHoleGame.move(ThreeHoleGame.create(), { piece: "X", position: 2 }), {
        piece: "O",
        position: 0,
      })

      expect(game).toEqual({
        holes: ["O", ".", "X"],
        player: "X",
      })
    })

    it("third move", () => {
      const game = ThreeHoleGame.move(
        ThreeHoleGame.move(ThreeHoleGame.move(ThreeHoleGame.create(), { piece: "X", position: 2 }), {
          piece: "O",
          position: 0,
        }),
        {
          piece: "X",
          position: 1,
        },
      )

      expect(game).toEqual({
        holes: ["O", "X", "X"],
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
})
