let canvas, ctx;
let size, cellSize;
let board = [], player = 'B', specialMode = false, specialPlayer = '';
let gameOver = false, specialCount = 0, chainCount = 0;
let blackRevengeLeft = 0, whiteRevengeLeft = 0, canRevenge = false;
let difficulty = 'easy';
let aiEnabled = true;

const revengeBtn = document.getElementById("revengeBtn");
const scoreDiv = document.getElementById("score");
const messageDiv = document.getElementById("message");
const specialCountDiv = document.getElementById("specialCount");

document.getElementById("startBtn").addEventListener("click", startGame);

function startGame() {
    // 初期設定を取得
    size = parseInt(document.getElementById("boardSize").value);
    cellSize = 400 / size;
    blackRevengeLeft = whiteRevengeLeft = document.getElementById("revengeLimit").value === "unlimited" ? 9999 : parseInt(document.getElementById("revengeLimit").value);
    difficulty = document.getElementById("difficulty").value;
    aiEnabled = true;

    // UIロック
    document.getElementById("boardSize").disabled = true;
    document.getElementById("revengeLimit").disabled = true;
    document.getElementById("difficulty").disabled = true;
    document.getElementById("startBtn").disabled = true;

    canvas = document.getElementById("board");
    ctx = canvas.getContext("2d");

    initBoard();
    updateDisplay();
}

function initBoard() {
    board = Array.from({ length: size }, () => Array(size).fill('.'));
    const mid = Math.floor(size / 2);
    board[mid - 1][mid - 1] = board[mid][mid] = 'W';
    board[mid - 1][mid] = board[mid][mid - 1] = 'B';
    player = 'B';
    gameOver = false;
    specialMode = false;
    specialPlayer = '';
    specialCount = 0;
    chainCount = 0;
    canRevenge = false;
    revengeBtn.style.display = 'none';
    document.body.className = "";
    messageDiv.innerText = "";
}

function updateDisplay() {
    drawBoard();
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
                    ctx.fillStyle = flips >= 5 ? "#90d490" : flips >= 3 ? "#c6e6c6" : "#e8f8e8";
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }

            ctx.strokeStyle = "black";
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

            if (board[y][x] !== '.') {
                ctx.beginPath();
                ctx.arc(x * cellSize + cellSize/2, y * cellSize + cellSize/2, cellSize/2 - 4, 0, Math.PI*2);
                ctx.fillStyle = board[y][x] === 'B' ? "black" : "white";
                ctx.fill();
                ctx.stroke();
            }
        }
    }
}
function updateScore() {
    let b = 0, w = 0;
    board.flat().forEach(cell => {
        if (cell === 'B') b++;
        else if (cell === 'W') w++;
    });
    scoreDiv.innerText = `Black: ${b}　White: ${w}`;
}

function updateSpecialCount() {
    specialCountDiv.innerText = `Black Revenges Left: ${blackRevengeLeft} / White: ${whiteRevengeLeft}`;
}

function getFlips(x, y, p) {
    if (board[y][x] !== '.') return 0;
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]], total = 0;
    for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy, flips = 0;
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === (p === 'B' ? 'W' : 'B')) {
            flips++; nx += dx; ny += dy;
        }
        if (flips > 0 && nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === p) total += flips;
    }
    return total;
}

function applyMove(x, y, p) {
    board[y][x] = p;
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy, path = [];
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === (p === 'B' ? 'W' : 'B')) {
            path.push([nx, ny]); nx += dx; ny += dy;
        }
        if (path.length && nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === p) {
            path.forEach(([fx, fy]) => board[fy][fx] = p);
        }
    }
}

canvas.addEventListener("click", e => {
    if (gameOver) return;
    let x = Math.floor(e.offsetX / cellSize);
    let y = Math.floor(e.offsetY / cellSize);

    if (specialMode) {
        if (specialPlayer === 'B' && board[y][x] === 'W') triggerRevenge(x, y, 'B');
        else if (specialPlayer === 'W' && board[y][x] === 'B') triggerRevenge(x, y, 'W');
        return;
    }

    if (player !== 'B') return;  // プレイヤーは常に黒（先手）のみ操作

    let flips = getFlips(x, y, player);
    if (flips === 0) return;

    applyMove(x, y, player);
    updateDisplay();

    if (flips >= 2 && whiteRevengeLeft > 0) {
        specialMode = true;
        specialPlayer = 'W';
        whiteRevengeLeft--;
        messageDiv.innerText = "REVENGE! White is choosing...";
        revengeBtn.style.display = 'inline';
        revengeBtn.classList.add('flash');
        setTimeout(aiRevenge, 1000);
    } else {
        nextTurn();
    }
});

function triggerRevenge(x, y, newColor) {
    board[y][x] = newColor;
    let flips = getFlips(x, y, newColor);
    applyMove(x, y, newColor);
    updateDisplay();
    if (flips >= 2 && (newColor === 'B' ? whiteRevengeLeft : blackRevengeLeft) > 0) {
        specialPlayer = (newColor === 'B') ? 'W' : 'B';
        if (specialPlayer === 'W') {
            whiteRevengeLeft--;
            messageDiv.innerText = "REVENGE! White is choosing...";
            setTimeout(aiRevenge, 1000);
        } else {
            blackRevengeLeft--;
            messageDiv.innerText = "REVENGE! Click to revenge or QUIT.";
            revengeBtn.style.display = 'inline';
            revengeBtn.classList.add('flash');
        }
    } else {
        endRevenge();
    }
}

function aiRevenge() {
    let targets = [];
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            if (board[y][x] === 'B') targets.push([x, y]);

    if (targets.length === 0) {
        endRevenge();
        return;
    }

    const [x, y] = targets[Math.floor(Math.random() * targets.length)];
    triggerRevenge(x, y, 'W');
}

function endRevenge() {
    specialMode = false;
    specialPlayer = '';
    chainCount = 0;
    document.body.className = "";
    messageDiv.innerText = "";
    revengeBtn.style.display = 'none';
    revengeBtn.classList.remove('flash');
    nextTurn();
}

revengeBtn.addEventListener("click", () => {
    if (specialMode && specialPlayer === 'B') {
        endRevenge(); // プレイヤーがリベンジを放棄
    }
});

function nextTurn() {
    player = (player === 'B') ? 'W' : 'B';
    if (!hasValidMove(player)) {
        messageDiv.innerText = `${player} has no valid moves. Passing...`;
        player = (player === 'B') ? 'W' : 'B';
        if (!hasValidMove(player)) return showResult();
        setTimeout(nextTurn, 500);
        return;
    }

    updateDisplay();
    if (player === 'W' && aiEnabled) setTimeout(aiMove, 300);
}

function hasValidMove(p) {
    return board.some((row, y) => row.some((_, x) => getFlips(x, y, p) > 0));
}

function aiMove() {
    let moves = [];
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            if (getFlips(x, y, 'W') > 0) moves.push([x, y]);

    if (!moves.length) return nextTurn();

    let x, y;
    if (difficulty === 'easy') {
        [x, y] = moves[Math.floor(Math.random() * moves.length)];
    } else if (difficulty === 'hard') {
        let best = -1;
        for (const [mx, my] of moves) {
            const score = getFlips(mx, my, 'W');
            if (score > best) [x, y, best] = [mx, my, score];
        }
    } else if (difficulty === 'montecarlo') {
        let bestRate = -1;
        for (const [mx, my] of moves) {
            let wins = 0;
            for (let i = 0; i < 10; i++) {
                if (simulatePlayout([mx, my], JSON.parse(JSON.stringify(board))) === 'W') wins++;
            }
            let rate = wins / 10;
            if (rate > bestRate) [x, y, bestRate] = [mx, my, rate];
        }
    }

    let flips = getFlips(x, y, 'W');
    applyMove(x, y, 'W');
    updateDisplay();

    if (flips >= 2 && blackRevengeLeft > 0) {
        specialMode = true;
        specialPlayer = 'B';
        blackRevengeLeft--;
        messageDiv.innerText = "REVENGE! Click to revenge or QUIT.";
        revengeBtn.style.display = 'inline';
        revengeBtn.classList.add('flash');
    } else {
        nextTurn();
    }
}

function simulatePlayout(startMove, simBoard) {
    let simPlayer = 'W';
    applyMoveSim(startMove[0], startMove[1], simPlayer, simBoard);
    simPlayer = 'B';
    while (true) {
        const moves = [];
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++)
                if (getFlipsSim(x, y, simPlayer, simBoard) > 0) moves.push([x, y]);

        if (!moves.length) {
            simPlayer = simPlayer === 'B' ? 'W' : 'B';
            if (!moves.length) break;
            continue;
        }

        const [x, y] = moves[Math.floor(Math.random() * moves.length)];
        applyMoveSim(x, y, simPlayer, simBoard);
        simPlayer = simPlayer === 'B' ? 'W' : 'B';
    }

    let b = 0, w = 0;
    for (let row of simBoard) for (let c of row) {
        if (c === 'B') b++; else if (c === 'W') w++;
    }
    return b > w ? 'B' : w > b ? 'W' : 'D';
}

function getFlipsSim(x, y, p, board) {
    if (board[y][x] !== '.') return 0;
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]], total = 0;
    for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy, flips = 0;
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === (p === 'B' ? 'W' : 'B')) {
            flips++; nx += dx; ny += dy;
        }
        if (flips > 0 && nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === p) total += flips;
    }
    return total;
}

function applyMoveSim(x, y, p, board) {
    board[y][x] = p;
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy, path = [];
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === (p === 'B' ? 'W' : 'B')) {
            path.push([nx, ny]); nx += dx; ny += dy;
        }
        if (path.length && nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === p)
            path.forEach(([fx, fy]) => board[fy][fx] = p);
    }
}

function showResult() {
    gameOver = true;
    let b = 0, w = 0;
    board.flat().forEach(c => { if (c === 'B') b++; else if (c === 'W') w++; });
    messageDiv.innerText = b > w ? `Game Over! Black wins (${b} vs ${w})` :
                          w > b ? `Game Over! White wins (${w} vs ${b})` : `Game Over! It's a draw (${b} vs ${w})`;
}
