const size = 9;
const s = new Sudoku(size);

const table = document.createElement("div");
table.style.setProperty("--blockRows", s.blockHeight);
table.style.setProperty("--blockCols", s.blockWidth);
table.classList.add("grid");
for (let row = 0; row < size; row++) {
  for (let col = 0; col < size; col++) {
    const cell = document.createElement("div");
    cell.id = `cell-${row}-${col}`;
    cell.classList.add("cell");
    if (row === 0) {
      cell.classList.add("first-row-grid");
    }
    if (row + 1 === size) {
      cell.classList.add("last-row-grid");
    }
    if (row % s.blockHeight === 0) {
      cell.classList.add("first-row-block");
    }
    if ((row + 1) % s.blockHeight === 0) {
      cell.classList.add("last-row-block");
    }
    if (col === 0) {
      cell.classList.add("first-col-grid");
    }
    if (col + 1 === size) {
      cell.classList.add("last-col-grid");
    }
    if (col % s.blockWidth === 0) {
      cell.classList.add("first-col-block");
    }
    if ((col + 1) % s.blockWidth === 0) {
      cell.classList.add("last-col-block");
    }
    table.appendChild(cell);
  }
}

document.body.appendChild(table);

function displayTable() {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = document.getElementById(`cell-${row}-${col}`);
      const val = s.grid[row * size + col];
      cell.innerText = val === 0 ? "" : val;
    }
  }
}

function next(cb) {
  requestAnimationFrame(cb);
  // setTimeout(cb, 50);
}

let g = s.generateGrid();
let generatedGrid, solvedGrid;

function gridGenerationStep() {
  const { value, done } = g.next();
  if (!done) {
    const { row, col, n } = value;
    const cell = document.getElementById(`cell-${row}-${col}`);
    cell.innerText = n === 0 ? "" : n;
    next(gridGenerationStep);
  } else {
    generatedGrid = s.grid.slice();
    g = s.generatePuzzle(30);
    next(puzzleGenerationStep);
  }
}

function puzzleGenerationStep() {
  const { value, done } = g.next();
  if (!done) {
    const { row, col, n, transition } = value;
    const cell = document.getElementById(`cell-${row}-${col}`);
    switch (transition) {
      case "beginRemoving":
        cell.classList.add("removing");
        cell.innerText = "";
        break;
      case "endRemoving":
        cell.classList.remove("removing");
        cell.innerText = n === 0 ? "" : n;
        break;
      case "beginSolving":
        cell.classList.add("solving");
        break;
      case "endSolving":
        cell.classList.remove("solving");
        break;
    }
    next(puzzleGenerationStep);
  } else {
    if (value === false) {
      throw new Error("Couldn't generate puzzle");
    }
    g = s.solve();
    next(solveStep);
  }
}

function solveStep() {
  const { value, done } = g.next();
  if (!done) {
    const { row, col, n, transition } = value;
    const cell = document.getElementById(`cell-${row}-${col}`);
    switch (transition) {
      case "beginSolving":
        cell.classList.add("solving");
        break;
      case "endSolving":
        cell.classList.remove("solving");
        if (n !== 0) {
          cell.classList.add("solved");
        }
        break;
    }
    cell.innerText = n === 0 ? "" : n;
    next(solveStep);
  } else {
    solvedGrid = s.grid.slice();
    for (let i = 0; i < generatedGrid.length; i++) {
      if (generatedGrid[i] !== solvedGrid[i]) {
        throw new Error("Solution differs from puzzle");
      }
    }
  }
}

next(gridGenerationStep);
