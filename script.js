// ==== REVENGE OTHELLO FINAL FULL SCRIPT ====
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
let board = [], player = 'B', specialMode = false, specialPlayer = '';
let gameOver = false, specialCount = 0, chainCount = 0;
let blackRevengeLeft = 5, whiteRevengeLeft = 5, canRevenge = false;

function initBoard() {
    board = Array.from({ length: size }, () => Array(size).fill('.'));
    board[3][3] = board[4][4] = 'W';
    board[3][4] = board[4][3] = 'B';
    updateDisplay();
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
    board.flat().forEach(cell => { if (cell==='B') b++; else if (cell==='W') w++; });
    scoreDiv.innerText = `Black: ${b}  White: ${w}`;
}

function updateSpecialCount() {
    specialCountDiv.innerText = `Black Remaining Revenges: ${blackRevengeLeft} | White Remaining Revenges: ${whiteRevengeLeft}`;
}

function getFlips(x,y,p) {
    if(board[y][x]!=='.') return 0;
    let dirs=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]], total=0;
    for(let [dx,dy] of dirs){
        let nx=x+dx, ny=y+dy, flips=0;
        while(nx>=0&&nx<size&&ny>=0&&ny<size&&board[ny][nx]===(p==='B'?'W':'B')){
            flips++; nx+=dx; ny+=dy;
        }
        if(flips>0&&nx>=0&&nx<size&&ny>=0&&ny<size&&board[ny][nx]===p) total+=flips;
    }
    return total;
}

function applyMove(x,y,p) {
    let dirs=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    board[y][x]=p;
    for(let [dx,dy] of dirs){
        let nx=x+dx, ny=y+dy, path=[];
        while(nx>=0&&nx<size&&ny>=0&&ny<size&&board[ny][nx]===(p==='B'?'W':'B')){
            path.push([nx,ny]); nx+=dx; ny+=dy;
        }
        if(path.length>0&&nx>=0&&nx<size&&ny>=0&&ny<size&&board[ny][nx]===p) path.forEach(([fx,fy])=>board[fy][fx]=p);
    }
}

function handleClick(e) {
    if(gameOver||specialMode) return;
    let x=Math.floor(e.offsetX/cellSize), y=Math.floor(e.offsetY/cellSize), flips=getFlips(x,y,player);
    if(flips===0) return;
    applyMove(x,y,player);
    updateDisplay();
    let opponentLeft=player==='B'?whiteRevengeLeft:blackRevengeLeft;
    if(flips>=2&&opponentLeft>0){ canRevenge=true; revengeBtn.style.display='inline'; revengeBtn.classList.add('flash'); }
    else nextTurn();
}

revengeBtn.addEventListener("click",()=>{
    if(!canRevenge) return;
    startRevenge(player==='B'?'W':'B');
    canRevenge=false; revengeBtn.style.display='none'; revengeBtn.classList.remove('flash');
});

function startRevenge(byWho){
    specialCount++; specialMode=true; specialPlayer=byWho; chainCount++;
    if(specialPlayer==='B') blackRevengeLeft--; else whiteRevengeLeft--;
    document.body.className="";
    let lvl=chainCount>=3?3:chainCount;
    document.body.classList.add(`revenge-level-${lvl}-${specialPlayer==='B'?'black':'white'}`);
    messageDiv.innerText="REVENGE! Click opponent disc to flip.";
    updateSpecialCount();
}

canvas.addEventListener("click",e=>{
    if(specialMode){
        let x=Math.floor(e.offsetX/cellSize), y=Math.floor(e.offsetY/cellSize);
        if((specialPlayer==='B'&&board[y][x]==='W')||(specialPlayer==='W'&&board[y][x]==='B')) triggerRevenge(x,y,specialPlayer);
    } else handleClick(e);
});

function triggerRevenge(x,y,newColor){
    board[y][x]=newColor;
    let flips=getFlips(x,y,newColor);
    applyMove(x,y,newColor);
    updateDisplay();
    let opponentLeft=newColor==='B'?whiteRevengeLeft:blackRevengeLeft;
    if(flips>=2&&opponentLeft>0){ canRevenge=true; revengeBtn.style.display='inline'; revengeBtn.classList.add('flash'); }
    else{ specialMode=false; chainCount=0; messageDiv.innerText=""; document.body.className=""; nextTurn(); }
}

function nextTurn(){
    player=player==='B'?'W':'B';
    if(!hasValidMove(player)){
        messageDiv.innerText=`${player==='B'?'Black':'White'} no moves. Pass!`;
        player=player==='B'?'W':'B';
        if(!hasValidMove(player)) return showResult();
        return setTimeout(nextTurn,1000);
    }
    updateDisplay();
    if(player==='W') setTimeout(aiMove,300);
}

function hasValidMove(p){
    return board.some((row,y)=>row.some((_,x)=>getFlips(x,y,p)>0));
}

function aiMove(){
    let moves=getValidMoves('W');
    if(!moves.length) return nextTurn();
    let x,y;
    if(difficulty==='easy'){[x,y]=moves[Math.floor(Math.random()*moves.length)];}
    else if(difficulty==='hard'){let m=-1;for(let move of moves){let f=getFlips(move[0],move[1],'W');if(f>m){m=f;[x,y]=move;}}}
    else{let bw=-1;for(let move of moves){let w=0;for(let i=0;i<10;i++) if(simulatePlayout(move,JSON.parse(JSON.stringify(board)))==='W') w++;let r=w/10;if(r>bw){bw=r;[x,y]=move;}}}
    let flips=getFlips(x,y,'W');
    applyMove(x,y,'W'); updateDisplay();
    if(flips>=2&&blackRevengeLeft>0){ canRevenge=true; revengeBtn.style.display='inline'; revengeBtn.classList.add('flash'); }
    else nextTurn();
}

function getValidMoves(p){
    let m=[];
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(getFlips(x,y,p)>0) m.push([x,y]);
    return m;
}

function simulatePlayout(move,simBoard){
    let simP='W'; applyMoveSim(move[0],move[1],simP,simBoard); simP='B';
    while(true){
        let vm=getValidMovesSim(simP,simBoard);
        if(!vm.length){ simP=simP==='B'?'W':'B'; if(!getValidMovesSim(simP,simBoard).length) break; continue; }
        let [x,y]=vm[Math.floor(Math.random()*vm.length)];
        applyMoveSim(x,y,simP,simBoard); simP=simP==='B'?'W':'B';
    }
    let b=0,w=0;simBoard.flat().forEach(c=>{if(c==='B')b++;else if(c==='W')w++;});
    return w>b?'W':(b>w?'B':'D');
}
function applyMoveSim(x,y,p,simBoard){
    let dirs=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    simBoard[y][x]=p;
    for(let[dx,dy]of dirs){
        let nx=x+dx,ny=y+dy,path=[];
        while(nx>=0&&nx<size&&ny>=0&&ny<size&&simBoard[ny][nx]===(p==='B'?'W':'B')){path.push([nx,ny]);nx+=dx;ny+=dy;}
        if(path.length>0&&nx>=0&&nx<size&&ny>=0&&ny<size&&simBoard[ny][nx]===p)path.forEach(([fx,fy])=>simBoard[fy][fx]=p);
    }
}
function getValidMovesSim(p,simBoard){
    let m=[];
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(getFlipsSim(x,y,p,simBoard)>0) m.push([x,y]);
    return m;
}
function getFlipsSim(x,y,p,simBoard){
    if(simBoard[y][x]!=='.') return 0;
    let dirs=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]],total=0;
    for(let[dx,dy]of dirs){let nx=x+dx,ny=y+dy,f=0;
        while(nx>=0&&nx<size&&ny>=0&&ny<size&&simBoard[ny][nx]===(p==='B'?'W':'B')){f++;nx+=dx;ny+=dy;}
        if(f>0&&nx>=0&&nx<size&&ny>=0&&ny<size&&simBoard[ny][nx]===p)total+=f;
    }return total;
}
function showResult(){
    gameOver=true;
    let b=0,w=0;board.flat().forEach(c=>{if(c==='B')b++;else if(c==='W')w++;});
    messageDiv.innerText=b>w?`Game Over! Black wins (${b} vs ${w})`:w>b?`Game Over! White wins (${w} vs ${b})`:`Game Over! It's a draw (${b} vs ${w})`;
}
canvas.addEventListener("click",handleClick);
initBoard(); updateDisplay();
