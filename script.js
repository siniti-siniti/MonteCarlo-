const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const messageDiv = document.getElementById("message");
const specialCountDiv = document.getElementById("specialCount");
const revengeBtn = document.getElementById("revengeBtn");
const difficultySelect = document.getElementById("difficulty");

let difficulty = difficultySelect.value;
difficultySelect.addEventListener("change", e => {
    difficulty = e.target.value;
});

const size = 8;
const cellSize = canvas.width / size;
let board = [];
let player = 'B';
let specialMode = false;
let specialPlayer = '';
let gameOver = false;
let specialCount = 0;
let chainCount = 0;
let blackRevengeLeft = 5;
let whiteRevengeLeft = 5;
let canRevenge = false;

function initBoard() {
    board = Array.from({ length: size }, () => Array(size).fill('.'));
    board[3][3] = board[4][4] = 'W';
    board[3][4] = board[4][3] = 'B';
    updateScore();
    updateSpecialCount();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            ctx.fillStyle = "#388e3c";
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

            if (!specialMode) {
                let flips = getFlips(x, y, player);
                if (flips > 0) {
                    if (flips >= 5) ctx.fillStyle = "#90d490";
                    else if (flips >= 3) ctx.fillStyle = "#c6e6c6";
                    else ctx.fillStyle = "#e8f8e8";
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }

            ctx.strokeStyle = "black";
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

            if (board[y][x] === 'B' || board[y][x] === 'W') {
                ctx.beginPath();
                ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, cellSize / 2 - 4, 0, Math.PI * 2);
                ctx.fillStyle = board[y][x] === 'B' ? "black" : "white";
                ctx.fill();
                ctx.stroke();
            }
        }
    }
    updateScore();
    updateSpecialCount();
}

function updateScore() {
    let b = 0, w = 0;
    for (let row of board) {
        for (let cell of row) {
            if (cell === 'B') b++;
            if (cell === 'W') w++;
        }
    }
    scoreDiv.innerText = `Black: ${b}  White: ${w}`;
}

function updateSpecialCount() {
    specialCountDiv.innerText = `Black Remaining Revenges: ${blackRevengeLeft} | White Remaining Revenges: ${whiteRevengeLeft}`;
}

function getFlips(x, y, p) {
    if (board[y][x] !== '.') return 0;
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    let total = 0;
    for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy;
        let flips = 0;
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === (p === 'B' ? 'W' : 'B')) {
            flips++;
            nx += dx; ny += dy;
        }
        if (flips > 0 && nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === p) {
            total += flips;
        }
    }
    return total;
}

function handleClick(e) {
    if (gameOver || specialMode) return;
    let x = Math.floor(e.offsetX / cellSize);
    let y = Math.floor(e.offsetY / cellSize);

    let flips = getFlips(x, y, player);
    if (flips === 0) return;

    applyMove(x, y, player);
    drawBoard();

    let opponentRevengeLeft = player === 'B' ? whiteRevengeLeft : blackRevengeLeft;
    if (flips >= 2 && opponentRevengeLeft > 0) {
        canRevenge = true;
        revengeBtn.style.display = 'inline';
        revengeBtn.classList.add('flash');
    } else {
        nextTurn();
    }
}

function applyMove(x, y, p) {
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    board[y][x] = p;
    for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy;
        let path = [];
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === (p === 'B' ? 'W' : 'B')) {
            path.push([nx, ny]);
            nx += dx; ny += dy;
        }
        if (path.length > 0 && nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === p) {
            for (let [fx, fy] of path) {
                board[fy][fx] = p;
            }
        }
    }
}

function startRevenge(triggeredByOpponent) {
    specialCount++;
    updateSpecialCount();
    specialMode = true;
    specialPlayer = triggeredByOpponent;
    chainCount++;

    if (specialPlayer === 'B') blackRevengeLeft--;
    else whiteRevengeLeft--;

    document.body.className = "";
    let level = chainCount >= 3 ? 3 : chainCount;
    document.body.classList.add(`revenge-level-${level}-${specialPlayer === 'B' ? 'black' : 'white'}`);

    messageDiv.innerText = "REVENGE! Click opponent's disc to flip it.";
}

revengeBtn.addEventListener("click", () => {
    if (canRevenge) {
        startRevenge(player === 'B' ? 'W' : 'B');
        canRevenge = false;
        revengeBtn.style.display = 'none';
        revengeBtn.classList.remove('flash');
    }
});

function triggerRevenge(x, y, newColor) {
    board[y][x] = newColor;
    let flips = getFlips(x, y, newColor);
    applyMove(x, y, newColor);
    drawBoard();

    if (flips >= 2 && ((newColor === 'B' && whiteRevengeLeft > 0) || (newColor === 'W' && blackRevengeLeft > 0))) {
        canRevenge = true;
        revengeBtn.style.display = 'inline';
        revengeBtn.classList.add('flash');
    } else {
        specialMode = false;
        chainCount = 0;
        messageDiv.innerText = "";
        document.body.className = "";
        nextTurn();
    }
}

canvas.addEventListener("click", e => {
    if (specialMode) {
        let x = Math.floor(e.offsetX / cellSize);
        let y = Math.floor(e.offsetY / cellSize);
        if (specialPlayer === 'B' && board[y][x] === 'W') {
            triggerRevenge(x, y, 'B');
        } else if (specialPlayer === 'W' && board[y][x] === 'B') {
            triggerRevenge(x, y, 'W');
        }
    } else {
        handleClick(e);
    }
});

function nextTurn() {
    player = player === 'B' ? 'W' : 'B';
    if (!hasValidMove(player)) {
        messageDiv.innerText = `${player === 'B' ? 'Black' : 'White'} has no valid moves. Pass!`;
        player = player === 'B' ? 'W' : 'B';
        if (!hasValidMove(player)) {
            gameOver = true;
            let b = 0, w = 0;
            for (let row of board) {
                for (let cell of row) {
                    if (cell === 'B') b++;
                    if (cell === 'W') w++;
                }
            }
            if (b > w) {
                messageDiv.innerText = `Game Over! Black wins (${b} vs ${w})`;
            } else if (w > b) {
                messageDiv.innerText = `Game Over! White wins (${w} vs ${b})`;
            } else {
                messageDiv.innerText = `Game Over! It's a draw (${b} vs ${w})`;
            }
            return;
        }
        setTimeout(nextTurn, 1000);
        return;
    }
    drawBoard();
    if (player === 'W') setTimeout(aiMove, 500);
}

function hasValidMove(p) {
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            if (getFlips(x, y, p) > 0)
                return true;
    return false;
}

function getValidMoves(p) {
    let moves = [];
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            if (getFlips(x, y, p) > 0)
                moves.push([x, y]);
    return moves;
}

function aiMove() {
    let moves = getValidMoves('W');
    if (moves.length === 0) {
        nextTurn();
        return;
    }
    let x, y;
    if (difficulty === 'easy') {
        [x, y] = moves[Math.floor(Math.random() * moves.length)];
    } else if (difficulty === 'hard') {
        let maxFlips = -1;
        for (let move of moves) {
            let flips = getFlips(move[0], move[1], 'W');
            if (flips > maxFlips) {
                maxFlips = flips;
                [x, y] = move;
            }
        }
    } else { // montecarlo
        let bestWinRate = -1;
        for (let move of moves) {
            let wins = 0;
            for (let i = 0; i < 10; i++) {
                if (simulatePlayout(move, JSON.parse(JSON.stringify(board))) === 'W') wins++;
            }
            let rate = wins / 10;
            if (rate > bestWinRate) {
                bestWinRate = rate;
                [x, y] = move;
            }
        }
    }
    let flips = getFlips(x, y, 'W');
    applyMove(x, y, 'W');
    drawBoard();
    let opponentRevengeLeft = blackRevengeLeft;
    if (flips >= 2 && opponentRevengeLeft > 0) {
        canRevenge = true;
        revengeBtn.style.display = 'inline';
        revengeBtn.classList.add('flash');
    } else {
        nextTurn();
    }
}

function simulatePlayout(startMove, originalBoard) {
    let simBoard = JSON.parse(JSON.stringify(originalBoard));
    let simPlayer = 'W';
    applyMoveSim(startMove[0], startMove[1], simPlayer, simBoard);
    simPlayer = 'B';
    while (true) {
        let validMoves = getValidMovesSim(simPlayer, simBoard);
        if (validMoves.length === 0) {
            simPlayer = simPlayer === 'B' ? 'W' : 'B';
            if (getValidMovesSim(simPlayer, simBoard).length === 0) break;
            continue;
        }
        let [x, y] = validMoves[Math.floor(Math.random() * validMoves.length)];
        applyMoveSim(x, y, simPlayer, simBoard);
        simPlayer = simPlayer === 'B' ? 'W' : 'B';
    }
    let b = 0, w = 0;
    for (let row of simBoard)
        for (let cell of row) {
            if (cell === 'B') b++;
            if (cell === 'W') w++;
        }
    return w > b ? 'W' : (b > w ? 'B' : 'D');
}

function getValidMovesSim(p, simBoard) {
    let moves = [];
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            if (getFlipsSim(x, y, p, simBoard) > 0)
                moves.push([x, y]);
    return moves;
}

function getFlipsSim(x, y, p, simBoard) {
    if (simBoard[y][x] !== '.') return 0;
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],
