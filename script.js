window.onload = () => {
    let canvas, ctx;
    let size, cellSize;
    let board = [], player = 'B', specialMode = false, specialPlayer = '';
    let gameOver = false, chainCount = 0;
    let blackRevengeLeft = 0, whiteRevengeLeft = 0;
    let difficulty = 'easy';
    let aiEnabled = true;

    const revengeBtn = document.getElementById("revengeBtn");
    const scoreDiv = document.getElementById("score");
    const messageDiv = document.getElementById("message");
    const specialCountDiv = document.getElementById("specialCount");

    document.getElementById("startBtn").addEventListener("click", startGame);

    // ここに全ての関数(initBoard, updateDisplay, drawBoard など)
    // ...
};


function startGame() {
    size = parseInt(document.getElementById("boardSize").value);
    blackRevengeLeft = whiteRevengeLeft = parseInt(document.getElementById("revengeLimit").value);
    difficulty = document.getElementById("difficulty").value;

    document.getElementById("boardSize").disabled = true;
    document.getElementById("revengeLimit").disabled = true;
    document.getElementById("difficulty").disabled = true;
    document.getElementById("startBtn").disabled = true;

    canvas = document.getElementById("board");
    ctx = canvas.getContext("2d");
    canvas.style.display = "block";

    canvas.width = 400;
    canvas.height = 400;
    cellSize = 400 / size;

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
    chainCount = 0;
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
    board.flat().forEach(c => { if (c==='B') b++; else if (c==='W') w++; });
    scoreDiv.innerText = `Black: ${b}　White: ${w}`;
}

function updateSpecialCount() {
    specialCountDiv.innerText = `Black Revenges Left: ${blackRevengeLeft} | White: ${whiteRevengeLeft}`;
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
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    console.log(`Click at x=${x}, y=${y}, player=${player}`);

    if (x < 0 || x >= size || y < 0 || y >= size) return;

    if (specialMode) {
        if (specialPlayer === 'B' && board[y][x] === 'W') triggerRevenge(x, y, 'B');
        else if (specialPlayer === 'W' && board[y][x] === 'B') triggerRevenge(x, y, 'W');
        return;
    }
    if (player !== 'B') {
        console.log("Not your turn: player=", player);
        return;
    }

    let flips = getFlips(x, y, player);
    console.log(`Possible flips at ${x},${y} = ${flips}`);
    if (flips === 0) return;

    applyMove(x, y, player);
    updateDisplay();

    if (flips >= 2 && whiteRevengeLeft > 0) {
        startRevenge('W');
    } else {
        nextTurn();
    }
});

function startRevenge(who) {
    specialMode = true;
    specialPlayer = who;
    chainCount++;
    if (who === 'B') blackRevengeLeft--;
    else whiteRevengeLeft--;
    let lvl = chainCount >= 3 ? 3 : chainCount;
    document.body.className = `revenge-level-${lvl}-${who==='B'?'black':'white'}`;
    messageDiv.innerText = who==='B' ? "REVENGE! Click to flip or QUIT." : "REVENGE! White is thinking...";
    updateSpecialCount();
    if (who === 'W') setTimeout(aiRevenge, 1000);
    else revengeBtn.style.display = 'inline';
}

function triggerRevenge(x, y, color) {
    board[y][x] = color;
    let flips = getFlips(x, y, color);
    applyMove(x, y, color);
    updateDisplay();
    if (flips >= 2 && (color === 'B' ? whiteRevengeLeft : blackRevengeLeft) > 0) {
        startRevenge(color === 'B' ? 'W' : 'B');
    } else endRevenge();
}

function aiRevenge() {
    let targets = [];
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            if (board[y][x] === 'B') targets.push([x, y]);
    if (!targets.length) return endRevenge();
    let [x, y] = targets[Math.floor(Math.random() * targets.length)];
    triggerRevenge(x, y, 'W');
}

revengeBtn.addEventListener("click", () => {
    if (specialMode && specialPlayer === 'B') endRevenge();
});

function endRevenge() {
    specialMode = false;
    specialPlayer = '';
    chainCount = 0;
    document.body.className = "";
    messageDiv.innerText = "";
    revengeBtn.style.display = 'none';
    nextTurn();
}

function nextTurn() {
    player = player === 'B' ? 'W' : 'B';
    if (!hasValidMove(player)) {
        messageDiv.innerText = `${player==='B'?'Black':'White'} has no moves. Passing...`;
        player = player === 'B' ? 'W' : 'B';
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
            let score = getFlips(mx, my, 'W');
            if (score > best) [x, y, best] = [mx, my, score];
        }
    } else {
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
        startRevenge('B');
    } else nextTurn();
}

function simulatePlayout([x, y], simBoard) {
    let simPlayer = 'W';
    applyMoveSim(x, y, simPlayer, simBoard);
    simPlayer = 'B';

    while (true) {
        let moves = [];
        for (let yy = 0; yy < size; yy++)
            for (let xx = 0; xx < size; xx++)
                if (getFlipsSim(xx, yy, simPlayer, simBoard) > 0) moves.push([xx, yy]);

        if (!moves.length) {
            simPlayer = simPlayer === 'B' ? 'W' : 'B';
            moves = [];
            for (let yy = 0; yy < size; yy++)
                for (let xx = 0; xx < size; xx++)
                    if (getFlipsSim(xx, yy, simPlayer, simBoard) > 0) moves.push([xx, yy]);
            if (!moves.length) break;
        }

        let [mx, my] = moves[Math.floor(Math.random() * moves.length)];
        applyMoveSim(mx, my, simPlayer, simBoard);
        simPlayer = simPlayer === 'B' ? 'W' : 'B';
    }

    let b = 0, w = 0;
    simBoard.flat().forEach(c => { if (c==='B') b++; else if (c==='W') w++; });
    return b > w ? 'B' : w > b ? 'W' : 'D';
}

function getFlipsSim(x, y, p, simBoard) {
    if (simBoard[y][x] !== '.') return 0;
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]], total = 0;
    for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy, flips = 0;
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && simBoard[ny][nx] === (p === 'B' ? 'W' : 'B')) {
            flips++; nx += dx; ny += dy;
        }
        if (flips > 0 && nx >= 0 && nx < size && ny >= 0 && ny < size && simBoard[ny][nx] === p) total += flips;
    }
    return total;
}

function applyMoveSim(x, y, p, simBoard) {
    simBoard[y][x] = p;
    let dirs = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy, path = [];
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && simBoard[ny][nx] === (p === 'B' ? 'W' : 'B')) {
            path.push([nx, ny]); nx += dx; ny += dy;
        }
        if (path.length && nx >= 0 && nx < size && ny >= 0 && ny < size && simBoard[ny][nx] === p)
            path.forEach(([fx, fy]) => simBoard[fy][fx] = p);
    }
}

function showResult() {
    gameOver = true;
    let b = 0, w = 0;
    board.flat().forEach(c => { if (c==='B') b++; else if (c==='W') w++; });
    messageDiv.innerText = b > w ? `Game Over! Black wins (${b} vs ${w})`
        : w > b ? `Game Over! White wins (${w} vs ${b})`
        : `Game Over! It's a draw (${b} vs ${w})`;
}
