💪 よっしゃ！
じゃあ最終仕様として👇

---

# 🚀 最終仕様まとめ

✅ **REVENGEボタン方式**

* 画面右下に `REVENGE` ボタンを常時表示
* リベンジ条件を満たしたとき & リベンジ残数があれば点滅
* クリックすると即リベンジ発動（プレイヤーが決める）

✅ **リベンジ回数 5回制限**

* 各プレイヤー最大5回までリベンジ可能
* 上部に残回数を表示

✅ **自分が使いたいときだけリベンジできる**

* 使わなければ次ターンに進む

✅ **勝敗・スコア表示も全部込み**

---

# 🚀 完全統合版 `index.html`

（CSSとJSフック含む）

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>リベンジオセロ</title>
    <style>
        body { 
            font-family: sans-serif; 
            text-align: center; 
            background: #eee; 
            transition: background 0.5s;
        }
        canvas { border: 2px solid black; margin-top: 10px;}
        #controls { margin: 10px 0; }
        #rules { 
            max-width: 600px; 
            margin: 0 auto; 
            text-align: left; 
            background: #f8f8f8; 
            padding: 10px; 
            border-radius: 8px;
        }
        #revengeBtn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            font-size: 18px;
            background: #c33;
            color: white;
            border: none;
            border-radius: 8px;
            display: none;
            cursor: pointer;
        }
        #revengeBtn.flash {
            animation: flash 1s infinite;
        }
        @keyframes flash {
            0%, 100% { background: #c33; }
            50% { background: #e66; }
        }

        /* リベンジ背景（暗赤色系） */
        .revenge-level-1-black, .revenge-level-1-white { background: #5c1a1a; }
        .revenge-level-2-black, .revenge-level-2-white { background: #7a2222; }
        .revenge-level-3-black, .revenge-level-3-white { background: #a52a2a; }
    </style>
</head>
<body>
    <h1>リベンジオセロ 🎲</h1>
    <h2>ルール説明</h2>
    <div id="rules">
        これはちょっとヘンテコなオセロ！<br>
        <br>
        ▶ 石を置いて相手の石を挟むと、いつものように裏返る<br> 
        ▶ ただし！<strong>2個以上</strong>の石を一気に裏返すと、<br>
        相手に「リベンジチャンス」が発動！<br>
        <br>
        🔥 相手は好きなタイミングで <strong>REVENGE</strong> ボタンを押し、<br>
        あなたの石を1つ選んで自分の色に変えちゃう...<br> 
        さらに挟まれた石は裏返る！？<br> 
        <br>
        最後に盤面が埋まったら、石が多い方の勝ち！<br>
        ちょっと理不尽なオセロをお楽しみあれ！
    </div>

    <div id="controls">
        <label>AI Difficulty: </label>
        <select id="difficulty">
            <option value="easy">Easy (Random)</option>
            <option value="hard">Hard (Greedy)</option>
            <option value="montecarlo">Monte Carlo</option>
        </select>
    </div>
    <div id="score"></div>
    <div id="specialCount"></div>
    <div id="message"></div>
    <canvas id="board" width="400" height="400"></canvas>
    <button id="revengeBtn">REVENGE</button>

    <script src="script.js"></script>
</body>
</html>
```

---

# 🚀 完全統合版 `script.js`

これを `script.js` にコピペして保存👇

✅ ポイント

* 各プレイヤーリベンジ最大5回
* 上に残り回数表示
* リベンジできるときだけ `REVENGE` ボタンが点滅
* クリックで即リベンジモードへ

```javascript
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
```
