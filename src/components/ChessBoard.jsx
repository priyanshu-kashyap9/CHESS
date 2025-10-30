import React, { useState, useEffect } from "react";
import "./ChessBoard.css";

const PIECES = {
  wp: "♙", wr: "♖", wn: "♘", wb: "♗", wq: "♕", wk: "♔",
  bp: "♟", br: "♜", bn: "♞", bb: "♝", bq: "♛", bk: "♚",
};

export default function ChessBoard() {
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [turn, setTurn] = useState("w");
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    initBoard();
  }, []);

  const initBoard = () => {
    const newBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
    const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
    for (let c = 0; c < 8; c++) {
      newBoard[0][c] = { type: back[c], color: "b" };
      newBoard[1][c] = { type: "p", color: "b" };
      newBoard[6][c] = { type: "p", color: "w" };
      newBoard[7][c] = { type: back[c], color: "w" };
    }
    setBoard(newBoard);
    setSelected(null);
    setLegalMoves([]);
    setTurn("w");
    setFlipped(false);
  };

  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  const generateMoves = (r, c) => {
    const p = board[r][c];
    if (!p) return [];
    const moves = [];
    const enemy = p.color === "w" ? "b" : "w";

    const pushIf = (rr, cc) => {
      if (!inBounds(rr, cc)) return false;
      const target = board[rr][cc];
      if (!target) {
        moves.push({ r: rr, c: cc, capture: false });
        return true;
      }
      if (target.color === enemy) moves.push({ r: rr, c: cc, capture: true });
      return false;
    };

    if (p.type === "p") {
      const dir = p.color === "w" ? -1 : 1;
      const startRow = p.color === "w" ? 6 : 1;
      if (inBounds(r + dir, c) && !board[r + dir][c])
        moves.push({ r: r + dir, c, capture: false });
      if (
        r === startRow &&
        !board[r + dir][c] &&
        !board[r + 2 * dir][c]
      )
        moves.push({ r: r + 2 * dir, c, capture: false });
      for (const dc of [-1, 1]) {
        const rr = r + dir,
          cc = c + dc;
        if (
          inBounds(rr, cc) &&
          board[rr][cc] &&
          board[rr][cc].color === enemy
        )
          moves.push({ r: rr, c: cc, capture: true });
      }
    }

    if (p.type === "n") {
      const deltas = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      deltas.forEach((d) => {
        const rr = r + d[0],
          cc = c + d[1];
        if (
          inBounds(rr, cc) &&
          (!board[rr][cc] || board[rr][cc].color === enemy)
        )
          moves.push({ r: rr, c: cc, capture: !!board[rr][cc] });
      });
    }

    if (["b", "r", "q"].includes(p.type)) {
      const dirs = [];
      if (["b", "q"].includes(p.type))
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (["r", "q"].includes(p.type))
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      for (const d of dirs) {
        let rr = r + d[0],
          cc = c + d[1];
        while (inBounds(rr, cc)) {
          if (!board[rr][cc]) {
            moves.push({ r: rr, c: cc, capture: false });
            rr += d[0];
            cc += d[1];
            continue;
          }
          if (board[rr][cc].color === enemy)
            moves.push({ r: rr, c: cc, capture: true });
          break;
        }
      }
    }

    if (p.type === "k") {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr,
            cc = c + dc;
          if (
            inBounds(rr, cc) &&
            (!board[rr][cc] || board[rr][cc].color === enemy)
          )
            moves.push({ r: rr, c: cc, capture: !!board[rr][cc] });
        }
    }
    return moves;
  };

  const makeMove = (r1, c1, r2, c2) => {
    const newBoard = board.map((row) => row.slice());
    const mover = newBoard[r1][c1];
    const target = newBoard[r2][c2];
    if (target && target.type === "k")
      alert(`${mover.color === "w" ? "White" : "Black"} wins! King captured.`);

    newBoard[r2][c2] = mover;
    newBoard[r1][c1] = null;

    if (mover.type === "p") {
      if ((mover.color === "w" && r2 === 0) || (mover.color === "b" && r2 === 7)) {
        newBoard[r2][c2] = { type: "q", color: mover.color };
      }
    }

    setBoard(newBoard);
    setTurn(turn === "w" ? "b" : "w");
  };

  const handleSquareClick = (r, c) => {
    const piece = board[r][c];

    if (piece && piece.color === turn) {
      setSelected({ r, c });
      setLegalMoves(generateMoves(r, c));
      return;
    }

    const lm = legalMoves.find((m) => m.r === r && m.c === c);
    if (lm && selected) {
      makeMove(selected.r, selected.c, r, c);
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    setSelected(null);
    setLegalMoves([]);
  };

  const rows = [...Array(8).keys()];
  if (flipped) rows.reverse();

  return (
    <div style={{ margin: "24px" }}>
      <h1>Chess</h1>
      <div className="board-wrap">
        <div className="board" aria-label="Chess board">
          {rows.map((r) => {
            const cols = [...Array(8).keys()];
            if (flipped) cols.reverse();
            return cols.map((c) => {
              const piece = board[r]?.[c];
              const isSelected = selected && selected.r === r && selected.c === c;
              const lm = legalMoves.find((m) => m.r === r && m.c === c);
              const classes = [
                "square",
                (r + c) % 2 === 0 ? "light" : "dark",
                isSelected ? "highlight" : "",
                lm ? (lm.capture ? "capture" : "highlight") : "",
              ].join(" ");
              return (
                <div
                  key={`${r}-${c}`}
                  className={classes}
                  onClick={() => handleSquareClick(r, c)}
                  title={piece ? `${piece.color === "w" ? "White" : "Black"} ${{
                    p: "Pawn",
                    r: "Rook",
                    n: "Knight",
                    b: "Bishop",
                    q: "Queen",
                    k: "King",
                  }[piece.type]}` : ""}
                >
                  {piece ? PIECES[piece.color + piece.type] : ""}
                </div>
              );
            });
          })}
        </div>

        <div className="info">
          <div className="controls">
            <button className="btn" onClick={initBoard}>Reset</button>
            <button className="btn" onClick={() => setFlipped(!flipped)}>Flip Board</button>
          </div>
          <div className="status">
            <div>Turn: <strong>{turn === "w" ? "White" : "Black"}</strong></div>
            <div className="small">
              Click a piece to see legal moves. Basic rules only: no check/checkmate, castling, or en passant.
            </div>
          </div>
        </div>
      </div>
      <footer>Made by Priyanshu Kashyap — React Chess Game</footer>
    </div>
  );
}
