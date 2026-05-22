/* ========================
   Bingo Game — app.js
======================== */

const ITEMS = [
  '고양이', '자전거', '어린이', '교회', '키링',
  '맨홀', '강아지', '화분', '새', '우체통',
  '놀이터', '버스', '비행기', '현수막', '운동기구',
  '시계', '모자', '선글라스', 'SUV', '커피',
  '마스크', '유아차', '편의점', '학교', '쓰레기'
];

let marked = Array(25).fill(false);
let numbers = [];
let bingoCells = new Set();
let newBingoCells = new Set();

/* ---------- Storage ---------- */

function save() {
  try {
    localStorage.setItem('bingo_numbers', JSON.stringify(numbers));
    localStorage.setItem('bingo_marked',  JSON.stringify(marked));
    showToast();
  } catch (e) {
    console.warn('localStorage 저장 실패:', e);
  }
}

function saveQuiet() {
  try {
    localStorage.setItem('bingo_numbers', JSON.stringify(numbers));
    localStorage.setItem('bingo_marked',  JSON.stringify(marked));
  } catch (e) {
    console.warn('localStorage 저장 실패:', e);
  }
}

function load() {
  try {
    const n = localStorage.getItem('bingo_numbers');
    const m = localStorage.getItem('bingo_marked');
    if (n && m) {
      numbers = JSON.parse(n);
      marked  = JSON.parse(m);
      return true;
    }
  } catch (e) {
    console.warn('localStorage 로드 실패:', e);
  }
  return false;
}

/* ---------- Helpers ---------- */
function generateNumbers() {
  const items = [...ITEMS];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function getLines() {
  const lines = [];
  for (let r = 0; r < 5; r++) lines.push([0,1,2,3,4].map(c => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0,1,2,3,4].map(r => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines;
}

function checkBingo() {
  const lines = getLines();
  const prevBingoCells = new Set(bingoCells);
  const complete = lines.filter(line => line.every(i => marked[i] || i === 12));
  bingoCells = new Set(complete.flat());
  newBingoCells = new Set([...bingoCells].filter(i => !prevBingoCells.has(i)));
  return complete.length;
}

/* ---------- UI ---------- */
function updateUI(n) {
  document.getElementById('cap-score').textContent = `빙고 ${n}줄`;
}

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  numbers.forEach((num, i) => {
    const isCenter = i === 12;
    const isMarked  = marked[i] || isCenter;
    const isBingo   = bingoCells.has(i);

    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('role', 'gridcell');

    if (isCenter) {
      cell.classList.add('cell-center');
      cell.setAttribute('aria-label', '중앙 칸 (자동 마킹)');
    } else if (isBingo) {
      cell.classList.add('bingo');
      if (newBingoCells.has(i)) cell.classList.add('bingo-new');
    } else if (isMarked) {
      cell.classList.add('marked');
      cell.setAttribute('aria-label', `${num} (선택됨)`);
    } else {
      cell.setAttribute('aria-label', `${num}`);
    }

    cell.textContent = isCenter ? '★' : num;

    if (!isCenter) {
      cell.setAttribute('tabindex', '0');
      cell.onclick = () => toggleCell(i);
      cell.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') toggleCell(i); };
    }

    board.appendChild(cell);
  });
}

function toggleCell(i) {
  marked[i] = !marked[i];
  const bingoCount = checkBingo();
  renderBoard();
  updateUI(bingoCount);
  saveQuiet();
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(msg = '✓ 저장됨') {
  const toast = document.getElementById('save-toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ---------- Game Control ---------- */
function resetGame() {
  if (!confirm('정말로 새로 시작할까요?')) return;
  marked  = Array(25).fill(false);
  numbers = generateNumbers();
  bingoCells = new Set();
  renderBoard();
  updateUI(0);
  saveQuiet();
  showToast('새로운 빙고판을 시작했어요.');
}

/* ---------- Image Save ---------- */
async function saveImage() {
  const el = document.getElementById('capture-area');
  const animatedCells = el.querySelectorAll('.bingo-new');
  animatedCells.forEach(cell => cell.classList.remove('bingo-new'));
  const allCells = el.querySelectorAll('.cell');
  const cellSize = allCells[0].offsetWidth + 'px';
  allCells.forEach(cell => {
    cell.style.width = cellSize;
    cell.style.height = cellSize;
    cell.style.aspectRatio = 'unset';
  });
  await new Promise(resolve => setTimeout(resolve, 50));
  const canvas = await html2canvas(el, {
    backgroundColor: '#FFFBF6',
    scale: 2,
    useCORS: true,
  });
  animatedCells.forEach(cell => cell.classList.add('bingo-new'));
  allCells.forEach(cell => {
    cell.style.width = '';
    cell.style.height = '';
    cell.style.aspectRatio = '';
  });
  const now = new Date();
  const fileName = `bingo_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    const newTab = window.open();
    newTab.document.write(`
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; background: #FFF; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
      img { max-width: 100%; border-radius: 12px; }
      p { color: #aaa; font-size: 14px; margin-top: 16px; text-align: center; padding: 0 24px; }
    </style>
  </head>
  <body>
    <img src="${canvas.toDataURL('image/png')}" />
    <p>이미지를 꾹 눌러서 사진 보관함에 저장해주세요.🙌</p>
  </body>
  </html>
`);
  } else {
    const link    = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  }
}

/* ---------- Share ---------- */
function getShareText() {
  const bingoCount = checkBingo();
  const checkedCount = marked.filter((v, i) => v && i !== 12).length;
  return `🚶‍♂️오늘의 산책 빙고: ${bingoCount}줄 달성!(${checkedCount}/24) #라브_산책빙고`;
}

async function shareTwitter() {
  alert('이미지 저장 후 함께 업로드해보세요.📸');
  const text = encodeURIComponent(getShareText() + '\n https://pl4net-0f-laive.github.io/walking-bingo/');
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}


/* ---------- Init ---------- */
(function init() {
  const hasData = load();
  if (hasData) {
    checkBingo();
    renderBoard();
    updateUI(checkBingo());
  } else {
    resetGame();
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const titleEl = document.querySelector('.capture-title');
  if (titleEl) titleEl.textContent = `📅 ${dateStr}`;
})();
