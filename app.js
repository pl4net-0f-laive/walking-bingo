/* ========================
   Bingo Game — app.js
======================== */

const ITEMS = [
  '고양이', '자전거', '어린이', '교회', '키링',
  '맨홀', '강아지', '화분', '새', '우체통',
  '놀이터', '버스', '비행기', '현수막', '운동기구',
  '시계', '모자', '선글라스', 'SUV 차량', '커피',
  '마스크', '유아차', '편의점', '학교', '쓰레기'
];

let marked = Array(25).fill(false);
let numbers = [];
let bingoCells = new Set();

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
  const lines    = getLines();
  const complete = lines.filter(line => line.every(i => marked[i] || i === 12));
  bingoCells     = new Set(complete.flat());
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
      cell.setAttribute('aria-label', `${num} (빙고)`);
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
  save();
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast() {
  const toast = document.getElementById('save-toast');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
}

/* ---------- Game Control ---------- */
function resetGame() {
  marked  = Array(25).fill(false);
  numbers = generateNumbers();
  bingoCells = new Set();
  renderBoard();
  updateUI(0);
  saveQuiet();
}

/* ---------- Image Save ---------- */
async function saveImage() {
  const el     = document.getElementById('capture-area');
  const canvas = await html2canvas(el, {
    backgroundColor: '#111118',
    scale: 2,
    useCORS: true,
  });
  const link      = document.createElement('a');
  const now = new Date();
  const fileName = `bingo_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  link.download = `${fileName}.png`;
  link.href       = canvas.toDataURL('image/png');
  link.click();
}

/* ---------- Share ---------- */
function getShareText() {
  const n = checkBingo();
  return `오늘의 산책 빙고: ${n}줄 달성!🚶‍♂️ #산책빙고`;
}

async function shareTwitter() {
  // 1. 이미지 자동 저장
  const el     = document.getElementById('capture-area');
  const canvas = await html2canvas(el, {
    backgroundColor: '#111118',
    scale: 2,
    useCORS: true,
  });
  const link    = document.createElement('a');
  const now = new Date();
  const fileName = `bingo_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  link.download = `${fileName}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();

  // 2. 잠깐 기다렸다가 트위터 공유창 열기
  setTimeout(() => {
    const text = encodeURIComponent(
      getShareText() + '\n\n(이미지를 첨부해서 공유해보세요!)'
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, 800);
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