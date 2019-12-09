function nearestFactors(n) {
  let a = Math.floor(Math.sqrt(n));
  for (; n % a !== 0; a--) {}
  return [a, n / a];
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
}

function randomRow(n) {
  const a = new Array(n);
  for (let i = 0; i < n; i++) {
    a[i] = i + 1;
  }
  shuffle(a);
  return a;
}

class Sudoku {
  constructor(size, flat = true) {
    this.size = size;
    [this.blockWidth, this.blockHeight] = nearestFactors(size);
    if (
      (flat && this.blockWidth < this.blockHeight) ||
      (!flat && this.blockWidth > this.blockHeight)
    ) {
      const tmp = this.blockWidth;
      this.blockWidth = this.blockHeight;
      this.blockHeight = tmp;
    }
    this.grid = new Array(size * size);
    for (let i = 0; i < size * size; i++) {
      this.grid[i] = 0;
    }
  }

  clone() {
    const s = new Sudoku(this.size);
    s.grid = this.grid.slice();
    return s;
  }

  row(n) {
    if (n < 0 || n >= this.size) {
      throw new Error("Height out of bounds");
    }
    return this.grid.slice(n * this.size, (n + 1) * this.size);
  }

  column(n) {
    if (n < 0 || n >= this.size) {
      throw new Error("Column out of bounds");
    }
    return this.grid.filter((_, i) => i % this.size === n);
  }

  block(n) {
    if (n < 0 || n >= this.size) {
      throw new Error("Block out of bounds");
    }
    const minI =
      this.size * this.blockHeight * Math.floor(n / this.blockHeight);
    const maxI = minI + this.size * this.blockHeight;
    const minCol = this.blockWidth * (n % this.blockHeight);
    const maxCol = minCol + this.blockWidth;
    return this.grid.filter((_, i) => {
      const col = i % this.size;
      return i >= minI && i < maxI && col >= minCol && col < maxCol;
    });
  }

  check(row, col, n) {
    const rowEntries = this.row(row);
    if (rowEntries.includes(n)) {
      return false;
    }
    const colEntries = this.column(col);
    if (colEntries.includes(n)) {
      return false;
    }
    const blockEntries = this.block(
      Math.floor(row / this.blockHeight) * this.blockHeight +
        Math.floor(col / this.blockWidth)
    );
    if (blockEntries.includes(n)) {
      return false;
    }
    return true;
  }

  *generateGrid() {
    if (!(yield* this.try(0, randomRow(this.size)))) {
      throw new Error("Could not create sudoku");
    }
  }

  *try(i, toPlace) {
    const row = Math.floor(i / this.size);
    const col = i % this.size;
    for (let j = 0; j < toPlace.length; j++) {
      const n = toPlace[j];
      if (this.check(row, col, n)) {
        this.grid[i] = n;
        yield { row, col, n };
        if (col + 1 === this.size) {
          if (row + 1 === this.size) {
            return true;
          }
          if (yield* this.try(i + 1, randomRow(this.size))) {
            return true;
          }
        } else {
          const toPlaceNext = toPlace.slice();
          toPlaceNext.splice(j, 1);
          if (yield* this.try(i + 1, toPlaceNext)) {
            return true;
          }
        }
      }
      this.grid[i] = 0;
      yield { row, col, n: 0 };
    }
    return false;
  }

  *generatePuzzle(toRemove) {
    const indices = new Array(this.size * this.size);
    for (let i = 0; i < this.size * this.size; i++) {
      indices[i] = i;
    }
    shuffle(indices);
    for (let j = 0; j < this.size * this.size && toRemove > 0; j++) {
      const i = indices[j];
      const row = Math.floor(i / this.size);
      const col = i % this.size;
      const n = this.grid[i];
      this.grid[i] = 0;
      yield { row, col, n: 0, transition: "beginRemoving" };
      const s = this.clone();
      if (yield* s.solve()) {
        toRemove--;
        yield { row, col, n: 0, transition: "endRemoving" };
      } else {
        this.grid[i] = n;
        yield { row, col, n, transition: "endRemoving" };
      }
    }
    return toRemove === 0;
  }

  *solve() {
    const toSolve = new Array();
    for (let i = 0; i < this.size * this.size; i++) {
      if (this.grid[i] === 0) {
        toSolve.push(i);
      }
    }
    const nums = new Array(this.size);
    for (let j = 0; j < this.size; j++) {
      nums[j] = j + 1;
    }
    for (let j = 0; j < toSolve.length; j++) {
      const i = toSolve[j];
      const row = Math.floor(i / this.size);
      const col = i % this.size;
      yield { row, col, n: 0, transition: "beginSolving" };
      const rowEntries = this.row(row);
      const colEntries = this.column(col);
      const blockEntries = this.block(
        Math.floor(row / this.blockHeight) * this.blockHeight +
          Math.floor(col / this.blockWidth)
      );
      const choices = nums
        .slice()
        .filter(
          v =>
            !rowEntries.includes(v) &&
            !colEntries.includes(v) &&
            !blockEntries.includes(v)
        );
      if (choices.length === 1) {
        this.grid[i] = choices[0];
        yield { row, col, n: choices[0], transition: "endSolving" };
        toSolve.splice(j, 1);
        j = -1;
      } else {
        this.grid[i] = 0;
        yield { row, col, n: 0, transition: "endSolving" };
      }
    }
    return toSolve.length === 0;
  }
}
