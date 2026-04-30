/* ========================================================= */
/* --- Probability (확률과 통계: 몬티홀 딜레마) Logic --- */
/* ========================================================= */

window.initProb = (function () {
    let _initialized = false;

    return function () {
        if (_initialized) return;
        _initialized = true;

        const pCanvas = document.getElementById('probCanvas');
        if (!pCanvas) return;
        const pCtx = pCanvas.getContext('2d');

        // 상태 관리
        let doors = [0, 1, 2]; // 0, 1, 2번 문
        let prizeDoor = -1;    // 자동차가 있는 문
        let selectedDoor = -1; // 플레이어가 고른 문
        let openedDoor = -1;   // 사회자가 연 문 (염소)

        // 0: 대기(문 고르기), 1: 사회자가 염소문 염 (바꿀지 선택), 2: 결과 발표
        let gameState = 0;

        // 통계 변수
        let stats = {
            total: 0,
            stayWins: 0,
            stayLosses: 0,
            switchWins: 0,
            switchLosses: 0
        };
        let chartHistory = [];

        const msgBox = document.getElementById('monty-status-msg');
        const choiceOverlay = document.getElementById('monty-choice-overlay');
        const stayBtn = document.getElementById('monty-btn-stay');
        const switchBtn = document.getElementById('monty-btn-switch');

        const stayRateTxt = document.getElementById('monty-stay-rate');
        const switchRateTxt = document.getElementById('monty-switch-rate');
        const totalSimTxt = document.getElementById('monty-total-sim');

        // 문 그리기 설정
        const doorW = 140;
        const doorH = 220;
        const gap = 80;
        const totalW = (doorW * 3) + (gap * 2);
        const startX = (pCanvas.width - totalW) / 2;
        const startY = (pCanvas.height - doorH) / 2 + 20;

        /* ==================== 1. 게임 핵심 로직 ==================== */

        function initGame() {
            // 자동차 문 랜덤 배치 (0, 1, 2)
            prizeDoor = Math.floor(Math.random() * 3);
            selectedDoor = -1;
            openedDoor = -1;
            gameState = 0;

            choiceOverlay.style.display = 'none';
            updateMessage("3개의 문 중 <strong>하나를 클릭</strong>해 주세요!", '#2b6cb0');
            drawDoors();
        }

        function updateMessage(html, color) {
            msgBox.innerHTML = html;
            msgBox.style.color = color;
        }

        function drawDoors() {
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

            // 바닥(무대) 그리기
            pCtx.fillStyle = '#f8fafc';
            pCtx.fillRect(0, startY + doorH - 20, pCanvas.width, pCanvas.height);
            pCtx.beginPath(); pCtx.moveTo(0, startY + doorH - 20); pCtx.lineTo(pCanvas.width, startY + doorH - 20);
            pCtx.strokeStyle = '#e2e8f0'; pCtx.lineWidth = 3; pCtx.stroke();

            for (let i = 0; i < 3; i++) {
                let dx = startX + i * (doorW + gap);
                let dy = startY;

                // 문틀 (그림자)
                pCtx.fillStyle = '#cbd5e0';
                pCtx.fillRect(dx - 5, dy - 5, doorW + 10, doorH + 5);

                // 문 안쪽 (내부)
                pCtx.fillStyle = '#2d3748';
                pCtx.fillRect(dx, dy, doorW, doorH);

                if (openedDoor === i || gameState === 2) {
                    // 문이 열린 상태: 내용물 보여주기
                    pCtx.font = '70px Arial';
                    pCtx.textAlign = 'center';
                    pCtx.textBaseline = 'middle';

                    if (i === prizeDoor) {
                        // 자동차 (파란 배경)
                        pCtx.fillStyle = '#ebf8ff'; pCtx.fillRect(dx, dy, doorW, doorH);
                        pCtx.fillText('🚗', dx + doorW / 2, dy + doorH / 2 - 10);
                        pCtx.fillStyle = '#3182ce'; pCtx.font = 'bold 20px Outfit'; pCtx.fillText('SPORTS CAR', dx + doorW / 2, dy + doorH - 30);
                    } else {
                        // 염소 (빨간 배경)
                        pCtx.fillStyle = '#fff5f5'; pCtx.fillRect(dx, dy, doorW, doorH);
                        pCtx.fillText('🐐', dx + doorW / 2, dy + doorH / 2 - 10);
                        pCtx.fillStyle = '#c53030'; pCtx.font = 'bold 20px Outfit'; pCtx.fillText('GOAT', dx + doorW / 2, dy + doorH - 30);
                    }
                } else {
                    // 닫힌 문 그리기
                    let doorColor = '#e2e8f0'; // 기본 회색 문
                    if (gameState === 0) doorColor = '#f6ad55'; // 선택 전엔 튀는 주황색
                    if (selectedDoor === i) doorColor = '#4fd1c5'; // 내가 고른 문(초록색 하이라이트)

                    pCtx.fillStyle = doorColor;
                    pCtx.fillRect(dx, dy, doorW, doorH);

                    // 문 손잡이
                    pCtx.beginPath();
                    pCtx.arc(dx + doorW - 20, dy + doorH / 2, 8, 0, Math.PI * 2);
                    pCtx.fillStyle = '#a0aec0'; pCtx.fill();

                    // 문 번호
                    pCtx.fillStyle = '#ffffff';
                    pCtx.font = 'bold 50px Outfit';
                    pCtx.textAlign = 'center';
                    pCtx.textBaseline = 'middle';
                    pCtx.fillText(i + 1, dx + doorW / 2, dy + doorH / 2);

                    // 내가 고른 문 하이라이트 표시
                    if (selectedDoor === i) {
                        pCtx.strokeStyle = '#38a169'; // 테두리 진한 초록
                        pCtx.lineWidth = 8;
                        pCtx.strokeRect(dx, dy, doorW, doorH);

                        pCtx.fillStyle = '#38a169';
                        pCtx.font = 'bold 20px Outfit';
                        pCtx.fillText('내 선택', dx + doorW / 2, dy - 20);
                    }
                }
            }
        }

        /* ==================== 2. 사용자 상호작용 (마우스 클릭) ==================== */
        pCanvas.addEventListener('click', (e) => {
            // 💡 추가된 기능: 게임이 끝난 상태(2)에서 클릭하면 새 게임 시작
            if (gameState === 2) {
                initGame();
                return;
            }

            if (gameState !== 0) return; // 문을 고르는 상태가 아니면 무시

            const rect = pCanvas.getBoundingClientRect();

            // 🌟 핵심 버그 수정: 캔버스 실제 크기와 화면 표시 크기의 비율 보정
            const scaleX = pCanvas.width / rect.width;
            const scaleY = pCanvas.height / rect.height;

            // 보정된 비율을 곱해서 정확한 캔버스 내부 좌표를 구합니다.
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            // 어떤 문을 클릭했는지 판별
            for (let i = 0; i < 3; i++) {
                let dx = startX + i * (doorW + gap);
                let dy = startY;
                // 정확해진 x, y 좌표로 문(hitbox) 클릭 여부 확인
                if (x >= dx && x <= dx + doorW && y >= dy && y <= dy + doorH) {
                    selectedDoor = i;
                    openGoatDoor();
                    break;
                }
            }
        });

        function openGoatDoor() {
            gameState = 1;
            // 내가 고르지 않고, 차도 없는 문(염소)을 찾는다.
            let availableDoors = [0, 1, 2].filter(d => d !== selectedDoor && d !== prizeDoor);

            // 만약 내가 차를 골랐다면, 염소문이 2개 남으므로 아무거나 연다.
            openedDoor = availableDoors[Math.floor(Math.random() * availableDoors.length)];

            drawDoors();
            updateMessage(`사회자가 <strong>${openedDoor + 1}번 문(염소)</strong>을 열었습니다!<br>선택을 바꾸시겠습니까?`, '#ed8936');

            // 선택 변경 팝업 띄우기
            setTimeout(() => {
                choiceOverlay.style.display = 'block';
            }, 500);
        }

        // '그대로 유지' 버튼
        stayBtn.addEventListener('click', () => {
            choiceOverlay.style.display = 'none';
            gameState = 2; // 결과 발표
            let win = (selectedDoor === prizeDoor);

            stats.total++;
            if (win) stats.stayWins++; else stats.stayLosses++;

            finishGame(win, "유지");
        });

        // '바꾸기' 버튼
        switchBtn.addEventListener('click', () => {
            choiceOverlay.style.display = 'none';
            gameState = 2; // 결과 발표

            // 남은 문으로 선택 변경
            selectedDoor = [0, 1, 2].find(d => d !== selectedDoor && d !== openedDoor);
            let win = (selectedDoor === prizeDoor);

            stats.total++;
            if (win) stats.switchWins++; else stats.switchLosses++;

            finishGame(win, "변경");
        });

        function finishGame(isWin, actionStr) {
            drawDoors();
            updateStatsUI();

            const resultMsg = isWin
                ? `🎉 <strong>자동차 당첨!</strong> (선택 ${actionStr} 성공)`
                : `😭 <strong>염소 당첨...</strong> (선택 ${actionStr} 실패)`;

            // 안내 문구 추가: 다음 게임을 유도합니다.
            updateMessage(`${resultMsg}<br><span style="font-size:14px; color:#718096; font-weight:normal;">화면을 클릭하면 다음 게임이 시작됩니다.</span>`, isWin ? '#38a169' : '#e53e3e');
        }

        /* ==================== 3. 통계 시뮬레이션 로직 ==================== */

        function updateStatsUI() {
            let stayTotal = stats.stayWins + stats.stayLosses;
            let switchTotal = stats.switchWins + stats.switchLosses;

            let stayRate = stayTotal === 0 ? 0 : (stats.stayWins / stayTotal * 100);
            let switchRate = switchTotal === 0 ? 0 : (stats.switchWins / switchTotal * 100);

            // 텍스트
            stayRateTxt.innerText = stayRate.toFixed(1) + '%';
            switchRateTxt.innerText = switchRate.toFixed(1) + '%';
            totalSimTxt.innerText = stats.total.toLocaleString();

            // 막대 레이스
            document.getElementById('monty-bar-stay').style.width = stayRate.toFixed(1) + '%';
            document.getElementById('monty-bar-switch').style.width = switchRate.toFixed(1) + '%';

            // 꺾은선 히스토리 기록 (최대 200개 포인트)
            if (stayTotal + switchTotal > 0) {
                chartHistory.push({ stay: stayRate, sw: switchRate, n: stats.total });
                if (chartHistory.length > 200) chartHistory.shift();
            }

            drawMontyChart();
        }

        function drawMontyChart() {
            const canvas = document.getElementById('monty-chart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width, H = canvas.height;
            const padL = 30, padR = 10, padT = 10, padB = 24;
            const w = W - padL - padR, h = H - padT - padB;

            ctx.clearRect(0, 0, W, H);

            // 배경
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(padL, padT, w, h);

            // 기준선 (33%, 50%, 67%)
            [[33.3, '#3182ce', '33%'], [50, '#cbd5e0', '50%'], [66.7, '#e53e3e', '67%']].forEach(([pct, color, label]) => {
                const y = padT + h - (pct / 100) * h;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 3]);
                ctx.moveTo(padL, y); ctx.lineTo(padL + w, y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = color;
                ctx.font = 'bold 9px Outfit, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(label, padL - 2, y + 3);
            });

            // 축
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            ctx.strokeRect(padL, padT, w, h);

            if (chartHistory.length < 2) {
                ctx.fillStyle = '#a0aec0'; ctx.font = '11px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('시뮬레이션을 실행하면 그래프가 나타납니다', padL + w / 2, padT + h / 2);
                return;
            }

            // 꺾은선 그리기
            [['stay', '#3182ce'], ['sw', '#e53e3e']].forEach(([key, color]) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                chartHistory.forEach((pt, i) => {
                    const x = padL + (i / (chartHistory.length - 1)) * w;
                    const y = padT + h - (pt[key] / 100) * h;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();
            });

            // x축 레이블 (총 시도 횟수)
            const last = chartHistory[chartHistory.length - 1];
            ctx.fillStyle = '#a0aec0'; ctx.font = '9px Outfit, sans-serif'; ctx.textAlign = 'right';
            ctx.fillText(`n=${last.n.toLocaleString()}`, padL + w, padT + h + 14);
        }
        // 고속 자동 시뮬레이션 함수 (애니메이션 효과 추가)
        function runSimulation(times) {
            // 버튼 연타 방지 (진행 중일 땐 막기)
            if (window.isSimulating) return;
            window.isSimulating = true;

            // 시뮬레이션을 몇 번에 걸쳐서 화면에 뿌려줄지 결정 (프레임 쪼개기)
            let chunks = 20; // 20번에 나눠서 보여줌
            let runsPerChunk = Math.ceil(times / chunks);
            let currentChunk = 0;

            const statBox = stayRateTxt.parentElement.parentElement;
            updateMessage(`🤖 <strong>${times.toLocaleString()}번</strong> 자동 시뮬레이션 진행 중...`, '#805ad5');

            let timer = setInterval(() => {
                let stayW = 0, stayL = 0, switchW = 0, switchL = 0;
                let actualRuns = Math.min(runsPerChunk, times - (currentChunk * runsPerChunk));

                for (let i = 0; i < actualRuns; i++) {
                    let p = Math.floor(Math.random() * 3);
                    let s = Math.floor(Math.random() * 3);
                    let avail = [0, 1, 2].filter(d => d !== p && d !== s);
                    let o = avail[Math.floor(Math.random() * avail.length)];

                    if (s === p) stayW++; else stayL++;
                    let newS = [0, 1, 2].find(d => d !== s && d !== o);
                    if (newS === p) switchW++; else switchL++;
                }

                // 누적 반영 (청크 단위로)
                stats.total += actualRuns;
                stats.stayWins += stayW; stats.stayLosses += stayL;
                stats.switchWins += switchW; stats.switchLosses += switchL;

                updateStatsUI();
                currentChunk++;

                if (currentChunk >= chunks) {
                    clearInterval(timer);
                    window.isSimulating = false;
                    updateMessage(`✅ <strong>${times.toLocaleString()}번</strong> 자동 시뮬레이션 완료!`, '#805ad5');
                    statBox.style.background = '#fff5f5';
                    statBox.style.borderColor = '#fed7d7';
                }
            }, 50); // 50ms마다 UI 업데이트 (총 1초 소요)
        }

        document.getElementById('monty-sim-10').addEventListener('click', () => runSimulation(10));
        document.getElementById('monty-sim-100').addEventListener('click', () => runSimulation(100));
        document.getElementById('monty-sim-1000').addEventListener('click', () => runSimulation(1000));

        document.getElementById('monty-reset-btn').addEventListener('click', () => {
            stats = { total: 0, stayWins: 0, stayLosses: 0, switchWins: 0, switchLosses: 0 };
            chartHistory = [];
            updateStatsUI();
            initGame();
        });

        // 탭 제어 (단일 탭이지만 확장성 고려)
        window.probSwitchPanel = function (tabName) {
            initGame(); // 탭 들어올 때마다 게임 초기화
        };

        // 최초 실행
        initGame();
        updateStatsUI();
    };
})();

/* ========================================================= */
/* --- 파스칼의 삼각형 (Pascal's Triangle) Logic --- */
/* ========================================================= */
window.initPascal = (function () {
    let _initialized = false;

    return function () {
        if (_initialized) return;
        _initialized = true;

        const canvas = document.getElementById('pascalCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // 상태 변수
        let numRows = 10; // 초기 층수
        let mode = 'basic'; // 'basic', 'binomial', 'rowSum', 'hockey', 'sierpinski', 'fibonacci'
        let hoverNode = null; // {n, r}

        // 조합 (nCr) 계산 캐시
        let combCache = {};
        function getComb(n, r) {
            if (r < 0 || r > n) return 0;
            if (r === 0 || r === n) return 1;
            const key = `${n},${r}`;
            if (combCache[key]) return combCache[key];
            combCache[key] = getComb(n - 1, r - 1) + getComb(n - 1, r);
            return combCache[key];
        }

        // UI 요소 연결
        const nSlider = document.getElementById('pascal-n-slider');
        const nValTxt = document.getElementById('pascal-n-val');
        const modeBtns = document.querySelectorAll('.pascal-mode-btn');
        const formulaBox = document.getElementById('pascal-formula-box');

        let viewMode = 'number';

        const viewBtns = {
            number: document.getElementById('pascal-view-number'),
            comb: document.getElementById('pascal-view-comb'),
            both: document.getElementById('pascal-view-both'),
        };

        Object.entries(viewBtns).forEach(([key, btn]) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                viewMode = key;
                Object.values(viewBtns).forEach(b => {
                    if (!b) return;
                    b.style.background = 'transparent';
                    b.style.color = '#718096';
                });
                btn.style.background = '#73a5ff';
                btn.style.color = 'white';
                draw();
            });
        });

        // 아래첨자 헬퍼 ← 바로 이어서 추가
        function toSub(n) {
            const subs = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
            return String(n).split('').map(d => subs[parseInt(d)] || d).join('');
        }

        // 모드 버튼 이벤트
        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeBtns.forEach(b => {
                    b.style.background = '#f8fafc';
                    b.style.color = '#475569';
                    b.style.borderColor = '#e2e8f0';
                });
                const target = e.target;
                target.style.background = '#ebf8ff';
                target.style.color = '#3182ce';
                target.style.borderColor = '#bee3f8';
                mode = target.dataset.mode;

                const binomialBox = document.getElementById('binomial-formula-box');
                if (binomialBox) binomialBox.style.display = mode === 'binomial' ? 'block' : 'none';
                hoverNode = null;
                updateFormulaBox();
                draw();
            });
        });

        // 층수 슬라이더 이벤트
        nSlider.addEventListener('input', (e) => {
            numRows = parseInt(e.target.value) + 1;
            nValTxt.innerText = e.target.value;
            hoverNode = null;
            updateFormulaBox();
            updateBinomialFormula(numRows - 1, -1);
            draw();
        });

        // 마우스 이벤트 (Hover 추적)
        canvas.addEventListener('mousemove', (e) => {
            if (mode === 'sierpinski') return;

            const rect = canvas.getBoundingClientRect();

            // 🌟 [핵심 수정] 화면(CSS) 크기와 캔버스 실제(내부) 크기의 비율을 구합니다.
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            // 🌟 구한 비율(scale)을 곱해서 마우스 좌표를 캔버스 내부 좌표로 완벽히 일치시킵니다!
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            let found = null;
            const layout = getLayoutInfo();

            for (let n = 0; n < numRows; n++) {
                for (let r = 0; r <= n; r++) {
                    let { cx, cy } = getCenter(n, r, layout);
                    let dist = Math.hypot(mouseX - cx, mouseY - cy);
                    if (dist < layout.hexRadius * 0.9) {
                        found = { n, r };
                        break;
                    }
                }
                if (found) break;
            }

            if (found !== hoverNode) {
                if (!found || !hoverNode || found.n !== hoverNode.n || found.r !== hoverNode.r) {
                    hoverNode = found;
                    updateFormulaBox();

                    if (mode === 'binomial' && hoverNode) {
                        // 이항 계수 모드: 호버한 셀의 행(n)으로 전개식, r번째 항 강조
                        updateBinomialFormula(hoverNode.n, hoverNode.r);
                    } else {
                        let hlIndex = (hoverNode && hoverNode.n === numRows - 1) ? hoverNode.r : -1;
                        updateBinomialFormula(numRows - 1, hlIndex);
                    }
                    draw();
                }
            }
        });

        canvas.addEventListener('mouseleave', () => {
            hoverNode = null;
            if (mode !== 'sierpinski') {
                updateFormulaBox();
                // 이항 계수 모드일 때는 공식 초기화(n=-1)
                if (mode === 'binomial') {
                    updateBinomialFormula(-1, -1);
                } else {
                    updateBinomialFormula(numRows - 1, -1);
                }
                draw();
            }
        });

        // 위치 계산 헬퍼 함수
        function getLayoutInfo() {
            const maxRadius = 35;
            const minRadius = 18;
            let hexRadius = Math.max(minRadius, maxRadius - (numRows - 4) * 1.5);
            let hexHeight = hexRadius * Math.sqrt(3);
            let hexWidth = hexRadius * 2;
            let gapX = hexWidth * 0.8;
            let gapY = hexHeight * 0.85;

            let startX = canvas.width / 2;
            let startY = 40;
            return { hexRadius, gapX, gapY, startX, startY };
        }

        function getCenter(n, r, layout) {
            let cx = layout.startX + (r - n / 2) * layout.gapX;
            let cy = layout.startY + n * layout.gapY;
            return { cx, cy };
        }

        function drawHexagon(ctx, x, y, radius, fillStyle, strokeStyle, lineWidth) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                let angle = (Math.PI / 3) * i + (Math.PI / 6);
                let px = x + radius * Math.cos(angle);
                let py = y + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
            if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = lineWidth; ctx.stroke(); }
        }
        function updateBinomialFormula(n, highlightIndex = -1) {
            const formulaBox = document.getElementById('binomial-formula-box'); // index.html에 추가한 상자 ID
            if (!formulaBox || n < 0) return;

            if (n === 0) {
                katex.render("(a+b)^0 = 1", formulaBox, { throwOnError: false });
                return;
            }

            let latexStr = `(a+b)^{${n}} = `;

            for (let k = 0; k <= n; k++) {
                let coeff = getComb(n, k); // math.js 대신 prob.js 내장 함수 사용
                let aPower = n - k;
                let bPower = k;

                let term = "";
                if (coeff !== 1 || (aPower === 0 && bPower === 0)) term += coeff;
                if (aPower > 0) term += `a^{${aPower > 1 ? aPower : ''}}`;
                if (bPower > 0) term += `b^{${bPower > 1 ? bPower : ''}}`;

                if (k === highlightIndex) {
                    term = `\\textcolor{#e53e3e}{\\mathbf{${term}}}`; // 하이라이트 (빨간색)
                }

                latexStr += term;
                if (k < n) latexStr += " + ";
            }

            katex.render(latexStr, formulaBox, { throwOnError: false });
        }

        function updateFormulaBox() {
            // 프랙탈 모드는 기본 설명 고정
            if (mode === 'sierpinski') {
                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                        <span style="font-size:16px; color:#805ad5; font-weight:800;">시에르핀스키 삼각형 (프랙탈)</span>
                        <div style="font-size:14px; color:#4a5568; line-height:1.5;">
                            짝수는 투명하게, <strong style="color:#e53e3e;">홀수는 색칠하면</strong> 나타나는 신비한 패턴!<br>
                            슬라이더로 층수(n)를 늘려보세요.
                        </div>
                    </div>`;
                return;
            }

            if (!hoverNode) {
                formulaBox.innerHTML = "<span style='color:#a0aec0; font-size:16px;'>마우스를 올려보세요!</span>";
                return;
            }

            const n = hoverNode.n;
            const r = hoverNode.r;
            const val = getComb(n, r);

            if (mode === 'basic') {
                if (n === 0) {
                    formulaBox.innerHTML = `₀C₀ = 1`;
                    return;
                }
                let left = getComb(n - 1, r - 1);
                let right = getComb(n - 1, r);

                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:8px; line-height:1.2;">
                        <div>
                            <span class="pascal-hl-blue"><sub>${n - 1}</sub>C<sub>${r - 1}</sub></span> + 
                            <span class="pascal-hl-green"><sub>${n - 1}</sub>C<sub>${r}</sub></span> = 
                            <span class="pascal-hl-red"><sub>${n}</sub>C<sub>${r}</sub></span>
                        </div>
                        <div style="font-size:18px; color:#718096;">
                            <span class="pascal-hl-blue">${left}</span> + 
                            <span class="pascal-hl-green">${right}</span> = 
                            <span class="pascal-hl-red">${val}</span>
                        </div>
                    </div>
                `;
            }
            else if (mode === 'rowSum') {
                let sum = Math.pow(2, n);
                let combText = n <= 4 ?
                    Array.from({ length: n + 1 }, (_, i) => `<sub>${n}</sub>C<sub>${i}</sub>`).join(" + ") :
                    `<sub>${n}</sub>C<sub>0</sub> + <sub>${n}</sub>C<sub>1</sub> + ··· + <sub>${n}</sub>C<sub>${n}</sub>`;

                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:8px; line-height:1.3;">
                        <span style="font-size:15px; color:#718096; font-weight:700;">n = ${n} 행의 이항계수의 합</span>
                        <div style="font-size:18px; color:#4a5568;">${combText}</div>
                        <div style="margin-top:2px;">
                            = <span class="pascal-hl-blue" style="font-size:24px;">2<sup>${n}</sup></span> 
                            = <span class="pascal-hl-red" style="font-size:24px;">${sum}</span>
                        </div>
                    </div>
                `;
            }
            else if (mode === 'hockey') {
                if (n === 0 || r === 0 || r === n) {
                    formulaBox.innerHTML = "<span style='color:#a0aec0; font-size:15px;'>가장자리가 아닌 안쪽 숫자를 선택해 보세요!</span>";
                    return;
                }

                /* 파란: 열 r-1 고정, row = r-1 ~ n-1 */
                let leftNodes = [];
                for (let row = r - 1; row < n; row++) {
                    leftNodes.push({ n: row, r: r - 1, val: getComb(row, r - 1) });
                }

                /* 초록: C(n-1,r)+C(n-2,r-1)+...+C(n-r-1,0), 셀 (n-1-i, r-i) */
                let rightNodes = [];
                for (let i = 0; i <= r; i++) {
                    rightNodes.push({ n: n - 1 - i, r: r - i, val: getComb(n - 1 - i, r - i) });
                }

                function makeStickHTML(nodes) {
                    if (nodes.length === 0) return '—';
                    return nodes.length <= 5
                        ? nodes.map(nd => `<sub>${nd.n}</sub>C<sub>${nd.r}</sub>`).join(' + ')
                        : `<sub>${nodes[0].n}</sub>C<sub>${nodes[0].r}</sub> + ··· + <sub>${nodes[nodes.length - 1].n}</sub>C<sub>${nodes[nodes.length - 1].r}</sub>`;
                }
                function makeNumHTML(nodes) {
                    if (nodes.length === 0) return '—';
                    return nodes.length <= 5
                        ? nodes.map(nd => nd.val).join(' + ')
                        : `${nodes[0].val} + ··· + ${nodes[nodes.length - 1].val}`;
                }

                const leftSum = getComb(n, r);

                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                        <span style="font-size:13px; color:#718096; font-weight:700;">하키스틱 패턴 — 양방향</span>
                        <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
                            <div style="text-align:center;">
                                <div style="font-size:11px; color:#2b6cb0; font-weight:800; margin-bottom:3px;">← 왼쪽 하키스틱</div>
                                <div style="font-size:15px;">
                                    <span class="pascal-hl-blue">${makeStickHTML(leftNodes)}</span> = <span class="pascal-hl-red"><sub>${n}</sub>C<sub>${r}</sub></span>
                                </div>
                                <div style="font-size:17px; margin-top:2px;">
                                    <span class="pascal-hl-blue">${makeNumHTML(leftNodes)}</span> = <span class="pascal-hl-red">${leftSum}</span>
                                </div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:11px; color:#276749; font-weight:800; margin-bottom:3px;">nCr 대각 분해 →</div>
                                <div style="font-size:15px;">
                                    <span class="pascal-hl-green">${makeStickHTML(rightNodes)}</span> = <span class="pascal-hl-red"><sub>${n}</sub>C<sub>${r}</sub></span>
                                </div>
                                <div style="font-size:17px; margin-top:2px;">
                                    <span class="pascal-hl-green">${makeNumHTML(rightNodes)}</span> = <span class="pascal-hl-red">${val}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            else if (mode === 'fibonacci') {
                // 피보나치: n+r 이 같은 대각선
                let targetK = n + r;
                let fiboNodes = [];
                for (let i = 0; i <= numRows; i++) {
                    let cR = i;
                    let cN = targetK - i;
                    if (cN >= 0 && cR <= cN && cN < numRows) {
                        fiboNodes.push(getComb(cN, cR));
                    }
                }
                let sum = fiboNodes.reduce((a, b) => a + b, 0);

                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                        <span style="font-size:15px; color:#718096; font-weight:700;">완만한 대각선의 합</span>
                        <div style="font-size: 20px;">
                            <span class="pascal-hl-blue">${fiboNodes.join(' + ')}</span> = <span class="pascal-hl-green">${sum}</span>
                        </div>
                        <span style="font-size:13px; color:#d69e2e; font-weight:800; background:#fefcbf; padding:3px 10px; border-radius:10px;">✨ 피보나치 수열의 ${targetK + 1}번째 수</span>
                    </div>
                `;
            }
            else if (mode === 'binomial') {
                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                        <div style="font-size:20px; color:#718096;">
                            (a+b)<sup>${n}</sup> 전개식의
                            <strong style="color:#e53e3e; font-size:20px;">a<sup>${n - r}</sup>b<sup>${r}</sup></strong> 항의 계수
                        </div>
                        <div style="font-size:20px; color:#4a5568; margin-top:2px;">
                            <sub>${n}</sub>C<sub>${r}</sub> = 
                            <strong style="color:#e53e3e; font-size:20px;">${val}</strong>
                        </div>
                    </div>
                `;
            }
        }

        // 메인 렌더링 함수
        function draw() {
            const layout = getLayoutInfo();
            const neededHeight = layout.startY + (numRows - 1) * layout.gapY + layout.hexRadius * 2 + 20;
            canvas.height = Math.max(300, neededHeight);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 하이라이트 계산
            let hlNodes = {};

            if (mode === 'sierpinski') {
                updateFormulaBox();
                // 시에르핀스키 모드는 마우스 오버 없이 전체 프랙탈 계산
                for (let n = 0; n < numRows; n++) {
                    for (let r = 0; r <= n; r++) {
                        if (getComb(n, r) % 2 !== 0) {
                            hlNodes[`${n},${r}`] = 'odd'; // 홀수 하이라이트
                        } else {
                            hlNodes[`${n},${r}`] = 'even'; // 짝수 투명
                        }
                    }
                }
            }
            else if (hoverNode) {
                if (mode === 'basic') {
                    if (hoverNode.n > 0) {
                        hlNodes[`${hoverNode.n - 1},${hoverNode.r - 1}`] = 'left';
                        hlNodes[`${hoverNode.n - 1},${hoverNode.r}`] = 'right';
                    }
                    hlNodes[`${hoverNode.n},${hoverNode.r}`] = 'sum';
                }
                else if (mode === 'rowSum') {
                    for (let k = 0; k <= hoverNode.n; k++) hlNodes[`${hoverNode.n},${k}`] = 'row';
                }
                else if (mode === 'binomial') {
                    // 호버한 셀만 강조
                    hlNodes[`${hoverNode.n},${hoverNode.r}`] = 'sum';
                }
                else if (mode === 'hockey') {
                    if (hoverNode.r > 0 && hoverNode.r < hoverNode.n) {
                        const hn = hoverNode.n, hr = hoverNode.r;

                        /* 선택 셀 (빨간) */
                        hlNodes[`${hn},${hr}`] = 'sum';

                        /* 파란 하키스틱: 열 r-1 고정, row = r-1 ~ n-1 */
                        for (let row = hr - 1; row < hn; row++) {
                            hlNodes[`${row},${hr - 1}`] = 'stick';
                        }

                        /* 초록 대각 하키스틱: C(n-1,r)+C(n-2,r-1)+...+C(n-r-1,0)
                           셀: (n-1-i, r-i) for i=0..r */
                        for (let i = 0; i <= hr; i++) {
                            hlNodes[`${hn - 1 - i},${hr - i}`] = 'stick-green';
                        }
                    }
                }
                else if (mode === 'fibonacci') {
                    let targetK = hoverNode.n + hoverNode.r;
                    for (let n = 0; n < numRows; n++) {
                        for (let r = 0; r <= n; r++) {
                            if (n + r === targetK) hlNodes[`${n},${r}`] = 'fibo';
                        }
                    }
                }
                else if (mode === 'polygonal') {
                    let isLeft = (hoverNode.r <= hoverNode.n / 2);
                    let targetDist = isLeft ? hoverNode.r : (hoverNode.n - hoverNode.r);

                    for (let n = 0; n < numRows; n++) {
                        for (let r = 0; r <= n; r++) {
                            let dist = isLeft ? r : (n - r);
                            if (dist === targetDist) hlNodes[`${n},${r}`] = 'poly';
                        }
                    }
                    hlNodes[`${hoverNode.n},${hoverNode.r}`] = 'sum'; // 선택한 곳 강한 강조
                }
            }

            // 그리기 루프
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let n = 0; n < numRows; n++) {
                for (let r = 0; r <= n; r++) {
                    let { cx, cy } = getCenter(n, r, layout);
                    let val = getComb(n, r);

                    let fill = '#ffffff';
                    let stroke = '#e2e8f0';
                    let textCol = '#4a5568';
                    let lineWidth = 2;

                    const hlType = hlNodes[`${n},${r}`];

                    if (hlType) {
                        lineWidth = 3;
                        if (hlType === 'sum') {
                            fill = '#fff5f5'; stroke = '#fc8181'; textCol = '#c53030';
                        } else if (hlType === 'left' || hlType === 'row' || hlType === 'stick' || hlType === 'poly') {
                            fill = '#ebf8ff'; stroke = '#73a5ff'; textCol = '#2b6cb0';
                        } else if (hlType === 'stick-green') {
                            fill = '#f0fff4'; stroke = '#48bb78'; textCol = '#276749';
                        } else if (hlType === 'right') {
                            fill = '#f0fff4'; stroke = '#48bb78'; textCol = '#276749';
                        } else if (hlType === 'fibo') {
                            fill = '#f0fff4'; stroke = '#38a169'; textCol = '#276749'; // 초록색 대각선
                        } else if (hlType === 'odd') {
                            fill = '#faf5ff'; stroke = '#b794f4'; textCol = '#805ad5'; // 프랙탈 홀수 (보라색)
                            lineWidth = 2;
                        } else if (hlType === 'even') {
                            fill = 'transparent'; stroke = 'rgba(226, 232, 240, 0.3)'; textCol = 'rgba(160, 174, 192, 0.2)'; // 짝수 투명화
                            lineWidth = 1;
                        }
                    } else if (hoverNode && hoverNode.n === n && hoverNode.r === r && mode !== 'sierpinski') {
                        fill = '#fffff0'; stroke = '#f6e05e';
                    }

                    drawHexagon(ctx, cx, cy, layout.hexRadius * 0.9, fill, stroke, lineWidth);

                    // 수정 (깔끔하게 정리)
                    if (mode === 'sierpinski' && numRows > 12) {
                        // 프랙탈 고층수: 글씨 생략
                    } else if (viewMode === 'comb') {
                        const combStr = n === 0 ? '₀C₀' : `${toSub(n)}C${toSub(r)}`;
                        ctx.font = `bold ${Math.max(9, layout.hexRadius * 0.55)}px Outfit`;
                        ctx.fillStyle = textCol;
                        ctx.fillText(combStr, cx, cy);
                    } else if (viewMode === 'both') {
                        const combStr = n === 0 ? '₀C₀' : `${toSub(n)}C${toSub(r)}`;
                        ctx.font = `bold ${Math.max(7, layout.hexRadius * 0.42)}px Outfit`;
                        ctx.fillStyle = textCol;
                        ctx.fillText(combStr, cx, cy - layout.hexRadius * 0.28);
                        ctx.font = `bold ${Math.max(9, layout.hexRadius * 0.55)}px Outfit`;
                        ctx.fillText(val, cx, cy + layout.hexRadius * 0.28);
                    } else {
                        if (val > 999) ctx.font = `bold ${Math.max(8, layout.hexRadius * 0.5)}px Outfit`;
                        else ctx.font = `bold ${Math.max(10, layout.hexRadius * 0.7)}px Outfit`;
                        ctx.fillStyle = textCol;
                        ctx.fillText(val, cx, cy);
                    }
                }
            }
        }
        const binomialBox = document.getElementById('binomial-formula-box');
        if (binomialBox) binomialBox.style.display = 'none'; // ★ 초기엔 숨김
        updateBinomialFormula(numRows - 1, -1);
        draw();
    };
})();

/* =====================================================
   이항분포 B(n, p) 시각화
   ===================================================== */
window.initBinom = (function () {
    let initialized = false;
    let barRects = [];  /* [{k, x, y, w, h}] */
    let selectedK = null;

    return function () {
        const canvas = document.getElementById('binom-canvas');
        const wrap = document.getElementById('canvas-wrap-binom');
        if (!canvas || !wrap) return;

        if (!initialized) {
            initialized = true;

            /* 슬라이더 이벤트 */
            document.getElementById('binom-n').addEventListener('input', function () {
                document.getElementById('binom-n-val').textContent = this.value;
                updateStats();
                draw();
            });
            document.getElementById('binom-p').addEventListener('input', function () {
                document.getElementById('binom-p-val').textContent = parseFloat(this.value).toFixed(2);
                updateStats();
                draw();
            });
            document.getElementById('binom-show-curve').addEventListener('change', draw);

            /* 막대 클릭 */
            canvas.addEventListener('click', function (e) {
                const rect = canvas.getBoundingClientRect();
                const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
                const my = (e.clientY - rect.top) * (canvas.height / rect.height);
                handleClick(mx, my);
            });

        }

        updateStats();
        draw();
    };

    /* ---------- 통계량 업데이트 ---------- */
    function updateStats() {
        const n = parseInt(document.getElementById('binom-n').value);
        const p = parseFloat(document.getElementById('binom-p').value);
        const ex = (n * p).toFixed(2);
        const vx = (n * p * (1 - p)).toFixed(2);
        const sx = Math.sqrt(n * p * (1 - p)).toFixed(2);
        document.getElementById('binom-ex').textContent = ex;
        document.getElementById('binom-vx').textContent = vx;
        document.getElementById('binom-sx').textContent = sx;
    }

    /* ---------- 이항계수 ---------- */
    function comb(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        k = Math.min(k, n - k);
        let c = 1;
        for (let i = 0; i < k; i++) c = c * (n - i) / (i + 1);
        return Math.round(c);
    }

    /* ---------- P(X = k) ---------- */
    function binomProb(n, k, p) {
        return comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }

    /* ---------- 정규분포 PDF ---------- */
    function normalPDF(x, mu, sigma) {
        return Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2)) / (sigma * Math.sqrt(2 * Math.PI));
    }

    /* ---------- 클릭한 막대 식별 ---------- */
    function handleClick(mx, my) {
        for (const b of barRects) {
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                selectedK = (selectedK === b.k) ? null : b.k;
                const n = parseInt(document.getElementById('binom-n').value);
                const p = parseFloat(document.getElementById('binom-p').value);
                if (selectedK !== null) {
                    const prob = binomProb(n, selectedK, p);
                    document.getElementById('binom-click-info').innerHTML =
                        `<span style="font-size:16px; color:#2b6cb0; font-weight:800;">k = ${selectedK}</span><br>` +
                        `P(X = ${selectedK})<br>` +
                        `<span style="font-size:22px; color:#e53e3e; font-weight:800;">= ${prob.toFixed(5)}</span><br>` +
                        `<span style="font-size:12px; color:#718096;">(${(prob * 100).toFixed(3)}%)</span>`;
                } else {
                    document.getElementById('binom-click-info').innerHTML =
                        '막대를 클릭하면<br>P(X = k) 값을 확인할 수 있어요.';
                }
                draw();
                return;
            }
        }
        /* 빈 공간 클릭 → 선택 해제 */
        selectedK = null;
        document.getElementById('binom-click-info').innerHTML =
            '막대를 클릭하면<br>P(X = k) 값을 확인할 수 있어요.';
        draw();
    }

    /* ---------- 그리기 ---------- */
    function draw() {
        const canvas = document.getElementById('binom-canvas');
        const wrap = document.getElementById('canvas-wrap-binom');
        if (!canvas || !wrap) return;

        const n = parseInt(document.getElementById('binom-n').value);
        const p = parseFloat(document.getElementById('binom-p').value);
        const showCurve = document.getElementById('binom-show-curve').checked;

        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        /* 여백 */
        const PAD_L = 60, PAD_R = 30, PAD_T = 40, PAD_B = 60;
        const chartW = W - PAD_L - PAD_R;
        const chartH = H - PAD_T - PAD_B;

        ctx.clearRect(0, 0, W, H);

        /* 배경 */
        ctx.fillStyle = 'rgba(255,255,255,0.0)';
        ctx.fillRect(0, 0, W, H);

        /* 확률값 배열 계산 */
        const probs = [];
        for (let k = 0; k <= n; k++) probs.push(binomProb(n, k, p));
        const maxProb = Math.max(...probs, 0.001);

        /* 막대 너비 계산 (n+1개) */
        const totalBars = n + 1;
        const barW = Math.max(2, Math.min(60, chartW / totalBars * 0.7));
        const step = chartW / totalBars;

        barRects = [];

        /* 격자선 */
        ctx.strokeStyle = 'rgba(160,160,160,0.2)';
        ctx.lineWidth = 0.5;
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const yy = PAD_T + chartH - (chartH / yTicks) * i;
            ctx.beginPath();
            ctx.moveTo(PAD_L, yy);
            ctx.lineTo(PAD_L + chartW, yy);
            ctx.stroke();
            /* y축 레이블 */
            ctx.fillStyle = '#a0aec0';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText((maxProb / yTicks * i).toFixed(3), PAD_L - 6, yy + 4);
        }

        /* 막대 그리기 */
        for (let k = 0; k <= n; k++) {
            const prob = probs[k];
            const barH = (prob / maxProb) * chartH;
            const bx = PAD_L + step * k + (step - barW) / 2;
            const by = PAD_T + chartH - barH;

            barRects.push({ k, x: bx, y: by, w: barW, h: barH });

            /* 선택된 막대 강조 */
            if (selectedK === k) {
                ctx.fillStyle = '#e53e3e';
                ctx.globalAlpha = 0.9;
            } else {
                /* p 값에 따라 색조 변화 (파랑 계열) */
                const hue = 210 + (p - 0.5) * 40;
                ctx.fillStyle = `hsl(${hue}, 70%, 58%)`;
                ctx.globalAlpha = 0.75;
            }
            ctx.fillRect(bx, by, barW, barH);
            ctx.globalAlpha = 1;

            /* 막대 테두리 */
            ctx.strokeStyle = selectedK === k ? '#c53030' : 'rgba(49,130,206,0.4)';
            ctx.lineWidth = selectedK === k ? 1.5 : 0.5;
            ctx.strokeRect(bx, by, barW, barH);

            /* x축 레이블 (n이 클 때는 간격 조절) */
            const labelStep = n <= 15 ? 1 : n <= 25 ? 2 : 3;
            if (k % labelStep === 0) {
                ctx.fillStyle = selectedK === k ? '#c53030' : '#4a5568';
                ctx.font = `${n > 20 ? 10 : 12}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(k, bx + barW / 2, PAD_T + chartH + 18);
            }
        }

        /* 기댓값 수직선 */
        const mu = n * p;
        const muX = PAD_L + step * mu + step / 2;
        ctx.save();
        ctx.strokeStyle = '#ed8936';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(muX, PAD_T);
        ctx.lineTo(muX, PAD_T + chartH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        /* 기댓값 레이블 */
        ctx.fillStyle = '#ed8936';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`E(X) = ${mu.toFixed(1)}`, muX, PAD_T - 8);

        /* 정규분포 근사 곡선 */
        if (showCurve && n >= 3) {
            const sigma = Math.sqrt(n * p * (1 - p));
            if (sigma > 0.01) {
                ctx.save();
                ctx.strokeStyle = '#9f7aea';
                ctx.lineWidth = 2.5;
                ctx.globalAlpha = 0.85;
                ctx.beginPath();

                let first = true;
                const steps = 400;
                for (let i = 0; i <= steps; i++) {
                    const kx = (i / steps) * n;
                    const pdf = normalPDF(kx, mu, sigma);
                    /* 정규분포 PDF를 이항분포 스케일에 맞게 변환 */
                    const pdfScaled = pdf * (maxProb / normalPDF(mu, mu, sigma));
                    const cx = PAD_L + step * kx + step / 2;
                    const cy = PAD_T + chartH - (pdfScaled / maxProb) * chartH;

                    if (first) { ctx.moveTo(cx, cy); first = false; }
                    else ctx.lineTo(cx, cy);
                }
                ctx.stroke();
                ctx.restore();

                /* 곡선 범례 */
                ctx.save();
                ctx.strokeStyle = '#9f7aea';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.85;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(W - PAD_R - 130, PAD_T + 10);
                ctx.lineTo(W - PAD_R - 100, PAD_T + 10);
                ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#9f7aea';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('정규분포 근사', W - PAD_R - 95, PAD_T + 14);
            }
        }

        /* 축 */
        ctx.strokeStyle = '#a0aec0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        /* y축 */
        ctx.moveTo(PAD_L, PAD_T);
        ctx.lineTo(PAD_L, PAD_T + chartH);
        /* x축 */
        ctx.lineTo(PAD_L + chartW, PAD_T + chartH);
        ctx.stroke();

        /* x축 제목 */
        ctx.fillStyle = '#718096';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('k (성공 횟수)', PAD_L + chartW / 2, H - 10);

        /* y축 제목 */
        ctx.save();
        ctx.translate(14, PAD_T + chartH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('P(X = k)', 0, 0);
        ctx.restore();
    }

})();


/* ========================================================= */
/* --- 갈톤 보드 (Galton Board) Logic --- */
/* ========================================================= */
window.initGalton = (function () {
    let _initialized = false;

    return function () {
        if (_initialized) return;

        const canvas = document.getElementById('galtonCanvas');
        if (!canvas) return;

        if (canvas.offsetWidth === 0) return;

        _initialized = true;

        const ctx = canvas.getContext('2d');

        const W = canvas.width;
        const H = canvas.height;

        let ROWS = 10;
        let P = 0.5;
        let ballRadius = 6;
        let ballSpeed = 3;
        let isRunning = false;
        let animRaf = null;
        let autoMode = false;

        let balls = [];
        let bins = [];
        let totalDropped = 0;
        let pins = [];
        let autoDropTimer = 0;
        let layout = {};

        function calcLayout() {
            const topPad = 60, botPad = 130, sidePad = 40;
            const boardH = H - topPad - botPad;
            const boardW = W - sidePad * 2;
            const rowGap = boardH / (ROWS + 1);
            const colGap = boardW / (ROWS + 1);
            const startX = W / 2;
            const startY = topPad;

            pins = [];
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c <= r; c++) {
                    pins.push({
                        x: startX + (c - r / 2) * colGap,
                        y: startY + (r + 1) * rowGap,
                        r, c
                    });
                }
            }
            bins = new Array(ROWS + 1).fill(0);
            return { topPad, botPad, sidePad, boardH, boardW, rowGap, colGap, startX, startY };
        }

        function pickColor(idx) {
            const colors = ['#ff8bad', '#73a5ff', '#b5ead7', '#ffd6a5', '#c9b1ff', '#4fd1c5', '#f6ad55', '#fc8181'];
            return colors[idx % colors.length];
        }

        function dropBall() {
            totalDropped++;
            balls.push({
                x: layout.startX, y: layout.startY - 10,
                vx: 0, vy: ballSpeed * 0.5,
                row: 0, col: 0,
                phase: 'fall',
                settled: false,
                binIdx: -1,
                color: pickColor(totalDropped),
                trail: [],
            });
        }

        function updateBalls() {
            const GRAVITY = 0.18 * ballSpeed;
            const BOUNCE_VY = ballSpeed * 1.8;
            const BOUNCE_VX = ballSpeed * 1.2;

            balls.forEach(ball => {
                if (ball.settled) return; // 이미 바닥에 닿아 폭발한 공은 무시

                ball.trail.push({ x: ball.x, y: ball.y });
                if (ball.trail.length > 8) ball.trail.shift();

                if (ball.phase === 'fall') {
                    ball.vy += GRAVITY;
                    ball.x += ball.vx;
                    ball.y += ball.vy;

                    if (ball.row < ROWS) {
                        const pinIdx = ball.row * (ball.row + 1) / 2 + ball.col;
                        const pin = pins[pinIdx];
                        if (pin && ball.y >= pin.y - 4 - ballRadius) {
                            const goRight = Math.random() < P;
                            ball.vx = goRight ? BOUNCE_VX : -BOUNCE_VX;
                            ball.vy = -BOUNCE_VY * 0.6;
                            ball.x = pin.x;
                            ball.y = pin.y - 4 - ballRadius;
                            if (goRight) ball.col++;
                            ball.row++;
                            ball.phase = 'bounce';
                        }
                    } else {
                        ball.phase = 'bin';
                        ball.binIdx = ball.col;
                    }
                } else if (ball.phase === 'bounce') {
                    ball.vy += GRAVITY;
                    ball.x += ball.vx;
                    ball.y += ball.vy;
                    ball.vx *= 0.88;
                    if (ball.vy > 0) ball.phase = 'fall';
                } else if (ball.phase === 'bin') {
                    ball.vy += GRAVITY;
                    ball.y += ball.vy;
                    ball.vx *= 0.7;
                    ball.x += ball.vx;

                    // 🌟 [수정] 바닥에 닿는 순간의 판정
                    const floorY = H - layout.botPad + 10;

                    if (ball.y >= floorY - ballRadius) {
                        // 공이 바닥에 닿으면 즉시 settled(폭발) 처리하고 막대그래프 숫자 1 증가
                        ball.settled = true;
                        bins[ball.binIdx]++;
                    }
                }
            });

            // 🌟 [수정] 바닥에 닿은(settled) 공은 배열에서 즉시 삭제! (메모리 절약, 버벅임 방지)
            balls = balls.filter(b => !b.settled);
        }

        function getBinCenterX(idx) { return layout.startX + (idx - ROWS / 2) * layout.colGap; }
        function getBinWidth() { return layout.colGap * 0.82; }

        function comb(n, k) {
            if (k < 0 || k > n) return 0;
            if (k === 0 || k === n) return 1;
            let result = 1;
            for (let i = 0; i < k; i++) result = result * (n - i) / (i + 1);
            return result;
        }
        function binomialP(n, k, p) { return comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);

            const floorY = H - layout.botPad + 10;
            const binW = getBinWidth();
            const maxBin = Math.max(...bins, 1);

            // 칸 & 막대그래프 그리기
            for (let i = 0; i <= ROWS; i++) {
                const cx = getBinCenterX(i);
                const cnt = bins[i];

                // 막대그래프 최대 높이 제한
                const maxBarHeight = layout.botPad - 40;
                const barH = (cnt / maxBin) * maxBarHeight;

                // 배경 연한 박스
                ctx.fillStyle = 'rgba(0,0,0,0.03)';
                ctx.fillRect(cx - binW / 2, floorY - maxBarHeight + 20, binW, maxBarHeight - 20);

                // 🌟 [수정] 누적된 숫자에 따라 자라나는 막대그래프 (진한 색상)
                if (cnt > 0) {
                    // 공 색상(파스텔톤) 중 하나를 고정으로 사용하거나 파란색 계열 사용
                    const alpha = 0.4 + (cnt / maxBin) * 0.4;
                    ctx.fillStyle = `rgba(115,165,255,${alpha})`;
                    ctx.fillRect(cx - binW / 2, floorY - barH, binW, barH);
                }

                // 칸막이 테두리
                ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
                ctx.strokeRect(cx - binW / 2, floorY - maxBarHeight + 20, binW, maxBarHeight - 20);

                // 🌟 [수정] 칸 위에 누적된 공의 개수(숫자) 표시
                if (cnt > 0) {
                    ctx.fillStyle = '#2b6cb0'; // 숫자 색상 진하게
                    ctx.font = 'bold 12px Outfit, sans-serif';
                    ctx.textAlign = 'center';
                    // 막대그래프 바로 위나 바닥 근처에 숫자 표시
                    ctx.fillText(cnt, cx, floorY - barH - 5);
                }
            }

            // 바닥선
            ctx.strokeStyle = '#cbd5e0'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(layout.sidePad, floorY); ctx.lineTo(W - layout.sidePad, floorY); ctx.stroke();

            // 핀
            pins.forEach(pin => {
                ctx.beginPath(); ctx.arc(pin.x, pin.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#4a5568'; ctx.fill();
                ctx.strokeStyle = '#718096'; ctx.lineWidth = 1; ctx.stroke();
            });

            // 🌟 [수정] 굴러떨어지는 중인 공들만 잔상과 함께 그림 (settled된 공은 이미 삭제됨)
            balls.forEach(ball => {
                // 잔상
                if (ball.trail.length > 1) {
                    ball.trail.forEach((pt, i) => {
                        const r = parseInt(ball.color.slice(1, 3), 16), g = parseInt(ball.color.slice(3, 5), 16), b = parseInt(ball.color.slice(5, 7), 16);
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, ballRadius * (i / ball.trail.length) * 0.6, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${r},${g},${b},${i / ball.trail.length * 0.25})`;
                        ctx.fill();
                    });
                }

                // 공 본체
                ctx.beginPath(); ctx.arc(ball.x + 2, ball.y + 2, ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fill(); // 그림자
                const grad = ctx.createRadialGradient(ball.x - 1, ball.y - 2, 1, ball.x, ball.y, ballRadius);
                grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.4, ball.color); grad.addColorStop(1, ball.color);
                ctx.beginPath(); ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = grad; ctx.fill();
            });

            // 이론값 점선 (종 모양 정규분포 곡선)
            if (totalDropped >= 5) {
                ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 3]);
                for (let i = 0; i <= ROWS; i++) {
                    const cx = getBinCenterX(i);
                    const expected = binomialP(ROWS, i, P) * totalDropped;
                    const maxExpected = Math.max(...Array.from({ length: ROWS + 1 }, (_, k) => binomialP(ROWS, k, P) * totalDropped));
                    // 막대그래프의 최대 높이에 맞춰 이론값 점선도 스케일링
                    const lineH = (expected / Math.max(maxBin, maxExpected)) * (layout.botPad - 40);
                    if (i === 0) ctx.moveTo(cx, floorY - lineH); else ctx.lineTo(cx, floorY - lineH);
                }
                ctx.stroke(); ctx.setLineDash([]);
            }

            // HUD
            ctx.fillStyle = '#2d3748'; ctx.font = 'bold 15px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(`갈톤 보드 | 핀 ${ROWS}행 | p = ${P.toFixed(2)} | 총 ${totalDropped}개`, W / 2, 24);
            ctx.fillStyle = '#718096'; ctx.font = '12px Outfit, sans-serif';
            ctx.fillText(`B(${ROWS}, ${P.toFixed(2)})  평균 μ = ${(ROWS * P).toFixed(1)}  표준편차 σ = ${Math.sqrt(ROWS * P * (1 - P)).toFixed(2)}`, W / 2, 42);
        }

        function loop() {
            animRaf = requestAnimationFrame(loop);
            if (autoMode) {
                autoDropTimer++;
                const interval = Math.max(1, Math.floor(8 / ballSpeed));
                if (autoDropTimer >= interval && totalDropped < 500) {
                    autoDropTimer = 0; dropBall();
                }
            }
            updateBalls(); draw();
        }

        function resetBoard() {
            balls = []; totalDropped = 0; autoDropTimer = 0;
            layout = calcLayout(); draw();
        }

        // 버튼 연결
        document.getElementById('galton-drop-1')?.addEventListener('click', () => dropBall());
        document.getElementById('galton-drop-10')?.addEventListener('click', () => {
            for (let i = 0; i < 10; i++) setTimeout(() => dropBall(), i * 80);
        });
        document.getElementById('galton-auto-on')?.addEventListener('click', function () {
            autoMode = !autoMode;
            this.innerText = autoMode ? '⏹ 자동 중지' : '▶ 자동 투하';
            this.style.background = autoMode
                ? 'linear-gradient(135deg,#fc8181,#e53e3e)'
                : 'linear-gradient(135deg,#68d391,#48bb78)';
        });
        document.getElementById('galton-reset')?.addEventListener('click', () => {
            autoMode = false;
            const btn = document.getElementById('galton-auto-on');
            if (btn) { btn.innerText = '▶ 자동 투하'; btn.style.background = 'linear-gradient(135deg,#68d391,#48bb78)'; }
            resetBoard();
        });
        document.getElementById('galton-rows')?.addEventListener('input', function () {
            ROWS = parseInt(this.value);
            document.getElementById('galton-rows-val').innerText = ROWS;
            resetBoard();
        });
        document.getElementById('galton-p')?.addEventListener('input', function () {
            P = parseFloat(this.value);
            document.getElementById('galton-p-val').innerText = P.toFixed(2);
            resetBoard();
        });
        document.getElementById('galton-speed')?.addEventListener('input', function () {
            ballSpeed = parseFloat(this.value);
            document.getElementById('galton-speed-val').innerText = ballSpeed.toFixed(1) + 'x';
        });

        layout = calcLayout();
        loop();
    };
})();

/* ========================================================= */
/* --- 정규분포 (Normal Distribution) Logic --- */
/* ========================================================= */
window.initNormal = (function () {
    let _initialized = false;
    let _drawNormal = null; // 외부 스코프에서 drawNormal 참조 보관

    return function () {
        if (_initialized) {
            if (_drawNormal) _drawNormal(); // 재진입 시 재렌더링
            return;
        }
        _initialized = true;

        const canvas = document.getElementById('normalCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        let mu = 0, sigma = 1, rangeA = -1, rangeB = 1;

        // 정규분포 PDF
        function pdf(x) {
            return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
                Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
        }

        // 수치 적분 (사다리꼴)
        function integrate(a, b) {
            const steps = 1000;
            const dx = (b - a) / steps;
            let sum = 0;
            for (let i = 0; i <= steps; i++) {
                const x = a + i * dx;
                const w = (i === 0 || i === steps) ? 0.5 : 1;
                sum += w * pdf(x);
            }
            return sum * dx;
        }

        // x좌표 ↔ 캔버스 픽셀 변환
        const PAD = { l: 60, r: 30, t: 60, b: 70 };
        const xMin = -5, xMax = 5;

        function toCanvasX(x) {
            return PAD.l + ((x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
        }
        function toCanvasY(y) {
            const maxY = 0.85; // y축 최대값
            return (H - PAD.b) - (y / maxY) * (H - PAD.t - PAD.b);
        }

        function drawNormal() {
            ctx.clearRect(0, 0, W, H);

            // ── 배경 그라데이션
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#f8faff');
            bg.addColorStop(1, '#ffffff');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            const baseY = H - PAD.b;

            // ── 격자선
            ctx.strokeStyle = '#edf2f7';
            ctx.lineWidth = 1;
            for (let x = Math.ceil(xMin); x <= xMax; x++) {
                const cx = toCanvasX(x);
                ctx.beginPath(); ctx.moveTo(cx, PAD.t); ctx.lineTo(cx, baseY); ctx.stroke();
            }

            // ── 색칠 영역 (a~b 구간)
            ctx.beginPath();
            ctx.moveTo(toCanvasX(rangeA), baseY);
            for (let px = toCanvasX(rangeA); px <= toCanvasX(rangeB); px++) {
                const x = xMin + (px - PAD.l) / (W - PAD.l - PAD.r) * (xMax - xMin);
                ctx.lineTo(px, toCanvasY(pdf(x)));
            }
            ctx.lineTo(toCanvasX(rangeB), baseY);
            ctx.closePath();
            const fillGrad = ctx.createLinearGradient(0, PAD.t, 0, baseY);
            fillGrad.addColorStop(0, 'rgba(49,130,206,0.75)');
            fillGrad.addColorStop(1, 'rgba(49,130,206,0.25)');
            ctx.fillStyle = fillGrad;
            ctx.fill();

            // ── 곡선
            ctx.beginPath();
            ctx.strokeStyle = '#3182ce';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            for (let px = PAD.l; px <= W - PAD.r; px++) {
                const x = xMin + (px - PAD.l) / (W - PAD.l - PAD.r) * (xMax - xMin);
                const y = toCanvasY(pdf(x));
                px === PAD.l ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
            }
            ctx.stroke();

            // ── μ 수직선
            const mux = toCanvasX(mu);
            ctx.beginPath();
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.moveTo(mux, PAD.t); ctx.lineTo(mux, baseY);
            ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = '#e53e3e'; ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'center';
            ctx.fillText('μ=' + mu, mux, PAD.t - 10);

            // ── σ 범위 표시 (μ±σ 화살표)
            ctx.strokeStyle = '#805ad5'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
            [mu - sigma, mu + sigma].forEach(sx => {
                const cx = toCanvasX(sx);
                ctx.beginPath(); ctx.moveTo(cx, PAD.t + 10); ctx.lineTo(cx, baseY); ctx.stroke();
            });
            ctx.setLineDash([]);
            ctx.fillStyle = '#805ad5'; ctx.font = 'bold 12px Outfit';
            ctx.fillText('σ', toCanvasX(mu + sigma) + 10, PAD.t + 25);

            // ── x축
            ctx.strokeStyle = '#cbd5e0'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(PAD.l, baseY); ctx.lineTo(W - PAD.r, baseY); ctx.stroke();

            // ── x축 눈금 및 레이블
            ctx.fillStyle = '#718096'; ctx.font = '12px Outfit'; ctx.textAlign = 'center';
            for (let x = Math.ceil(xMin); x <= xMax; x++) {
                const cx = toCanvasX(x);
                ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.lineTo(cx, baseY + 5); ctx.stroke();
                ctx.fillText(x, cx, baseY + 18);
            }

            // ── 확률 텍스트 (구간 중앙 위)
            const prob = integrate(rangeA, rangeB);
            const midX = toCanvasX((rangeA + rangeB) / 2);
            const midY = toCanvasY(pdf((rangeA + rangeB) / 2) / 2);
            ctx.fillStyle = '#2b6cb0'; ctx.font = 'bold 16px Outfit'; ctx.textAlign = 'center';
            ctx.fillText((prob * 100).toFixed(1) + '%', midX, midY);

            // ── 제목
            ctx.fillStyle = '#2d3748'; ctx.font = 'bold 15px Outfit'; ctx.textAlign = 'center';
            ctx.fillText(`N(${mu}, ${sigma}²)  —  정규분포`, W / 2, 30);

            // UI 수치 업데이트
            document.getElementById('normal-prob-val').innerText = (prob * 100).toFixed(1) + '%';
            
            // 표준화 Z값 업데이트
            const zA = sigma === 0 ? 0 : (rangeA - mu) / sigma;
            const zB = sigma === 0 ? 0 : (rangeB - mu) / sigma;
            const elZA = document.getElementById('normal-z-a');
            const elZB = document.getElementById('normal-z-b');
            if (elZA) elZA.innerText = zA.toFixed(2);
            if (elZB) elZB.innerText = zB.toFixed(2);
        }

        // 슬라이더 이벤트
        document.getElementById('normal-mu')?.addEventListener('input', function () {
            mu = parseFloat(this.value);
            document.getElementById('normal-mu-val').innerText = mu;
            drawNormal();
        });
        document.getElementById('normal-sigma')?.addEventListener('input', function () {
            sigma = parseFloat(this.value);
            document.getElementById('normal-sigma-val').innerText = sigma;
            drawNormal();
        });
        document.getElementById('normal-a')?.addEventListener('input', function () {
            rangeA = parseFloat(this.value);
            drawNormal();
        });
        document.getElementById('normal-b')?.addEventListener('input', function () {
            rangeB = parseFloat(this.value);
            drawNormal();
        });

        // 경험칙 버튼
        document.querySelectorAll('.normal-rule-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const k = parseInt(this.dataset.rule);
                document.getElementById('normal-a').value = mu - k * sigma;
                document.getElementById('normal-b').value = mu + k * sigma;
                rangeA = mu - k * sigma;
                rangeB = mu + k * sigma;
                drawNormal();
            });
        });

        _drawNormal = drawNormal; // 외부 참조에 등록
        drawNormal();
    };
})();

/* ========================================================= */
/* ========================================================= */
/* --- 큰수의 법칙 (Law of Large Numbers) Logic --- */
/* ========================================================= */
window.initLLN = (function () {
    let _initialized = false;

    return function () {
        if (_initialized) return;
        _initialized = true;

        const canvas = document.getElementById('llnCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        // 실험 설정
        let expType = 'coin'; // coin, dice, biased
        let history = []; // {n, xbar} 기록
        let runningSum = 0;
        let runningN = 0;

        let isAnimating = false;
        let animRaf = null;
        let lastSingleResult = null;
        let animObj = {
            type: 'coin',
            progress: 0,
            result: null,
            startTime: 0,
            duration: 600,
            targetTimes: 1
        };

        function getMu() {
            if (expType === 'coin') return 0.5;
            if (expType === 'dice') return 3.5;
            if (expType === 'biased') return 0.3;
        }

        function sampleOnce() {
            if (expType === 'coin') return Math.random() < 0.5 ? 1 : 0;
            if (expType === 'dice') return Math.floor(Math.random() * 6) + 1;
            if (expType === 'biased') return Math.random() < 0.3 ? 1 : 0;
        }

        function runExperiment(times) {
            if (isAnimating) return; // ignore if already running
            isAnimating = true;
            animObj.type = expType;
            animObj.progress = 0;
            animObj.startTime = performance.now();
            animObj.duration = times === 1 ? 600 : 1000;
            animObj.targetTimes = times;

            if (times === 1) {
                animObj.result = sampleOnce();
                lastSingleResult = animObj.result;
            } else {
                animObj.result = null;
            }

            cancelAnimationFrame(animRaf);
            animRaf = requestAnimationFrame(animLoop);
        }

        function animLoop(timestamp) {
            if (!isAnimating) return;
            const elapsed = timestamp - animObj.startTime;
            animObj.progress = Math.min(elapsed / animObj.duration, 1);

            draw();

            if (animObj.progress < 1) {
                animRaf = requestAnimationFrame(animLoop);
            } else {
                isAnimating = false;
                if (animObj.targetTimes === 1) {
                    runningSum += animObj.result;
                    runningN++;
                    history.push({ n: runningN, xbar: runningSum / runningN });
                } else {
                    for (let i = 0; i < animObj.targetTimes; i++) {
                        runningSum += sampleOnce();
                        runningN++;
                        if (runningN <= 200 || runningN % Math.max(1, Math.floor(animObj.targetTimes / 100)) === 0) {
                            history.push({ n: runningN, xbar: runningSum / runningN });
                        }
                    }
                    if (history.length === 0 || history[history.length - 1].n !== runningN) {
                        history.push({ n: runningN, xbar: runningSum / runningN });
                    }
                }
                updateUI();
                draw();
            }
        }

        function updateUI() {
            const mu = getMu();
            const xbar = runningN > 0 ? runningSum / runningN : null;
            document.getElementById('lln-mu-val').innerText = mu.toFixed(3);
            document.getElementById('lln-n-val').innerText = runningN.toLocaleString();
            document.getElementById('lln-xbar-val').innerText = xbar !== null ? xbar.toFixed(4) : '-';
            document.getElementById('lln-error-val').innerText = xbar !== null
                ? '|' + Math.abs(xbar - mu).toFixed(5) + '|'
                : '-';
        }

        function resetAll() {
            history = [];
            runningSum = 0;
            runningN = 0;
            lastSingleResult = null;
            isAnimating = false;
            cancelAnimationFrame(animRaf);
            updateUI();
            draw();
        }

        function drawCoin(x, y, scaleY, value, isBiased, sizeScale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(sizeScale, sizeScale * Math.abs(scaleY));

            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.fillStyle = isBiased ? '#fbd38d' : '#e2e8f0';
            ctx.fill();
            ctx.strokeStyle = isBiased ? '#dd6b20' : '#a0aec0';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.strokeStyle = isBiased ? '#f6ad55' : '#cbd5e0';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (value !== null) {
                ctx.fillStyle = isBiased ? '#c05621' : '#4a5568';
                ctx.font = 'bold 24px Outfit';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (Math.abs(scaleY) > 0.1) {
                    const text = value === 1 ? '앞(1)' : '뒤(0)';
                    ctx.fillText(text, 0, 0);
                }
            }
            ctx.restore();
        }

        function drawDice(x, y, rot, value, sizeScale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(sizeScale, sizeScale);
            ctx.rotate(rot);

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#cbd5e0';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.roundRect(-30, -30, 60, 60, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#e53e3e';
            if (value !== null) {
                const dot = (dx, dy) => {
                    ctx.beginPath();
                    ctx.arc(dx, dy, 5, 0, Math.PI * 2);
                    ctx.fill();
                };
                if ([1, 3, 5].includes(value)) dot(0, 0);
                if ([2, 3, 4, 5, 6].includes(value)) { dot(-15, -15); dot(15, 15); }
                if ([4, 5, 6].includes(value)) { dot(15, -15); dot(-15, 15); }
                if (value === 6) { dot(-15, 0); dot(15, 0); }
            }

            ctx.restore();
        }

        /* ── 그래프 그리기 ── */
        function draw() {
            ctx.clearRect(0, 0, W, H);

            const PAD = { l: 70, r: 60, t: 180, b: 60 };
            const mu = getMu();

            // 배경
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#f8faff');
            bg.addColorStop(1, '#ffffff');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            // --- 상단 애니메이션 및 시각화 영역 ---
            const cx = W / 2;
            const cy = 75;

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.05)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;
            ctx.fillRect(cx - 160, cy - 60, 320, 120);
            ctx.shadowColor = 'transparent';

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx - 160, cy - 60, 320, 120);

            ctx.fillStyle = '#a0aec0';
            ctx.font = '12px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('물리적 시행 결과', cx, cy - 45);

            let renderProgress = isAnimating ? animObj.progress : 1;
            let currentTimes = isAnimating ? animObj.targetTimes : 1;
            let finalResult = null;

            if (isAnimating && currentTimes === 1) {
                finalResult = animObj.result;
            } else if (!isAnimating) {
                finalResult = lastSingleResult !== null ? lastSingleResult : ((expType === 'dice') ? 6 : 1);
            }

            if (currentTimes === 1) {
                let cy_anim = cy;
                let scaleY = 1;
                let rot = 0;
                let valToDraw = finalResult;

                if (isAnimating && renderProgress < 1) {
                    cy_anim -= Math.sin(renderProgress * Math.PI) * 40;
                    if (expType === 'coin' || expType === 'biased') {
                        scaleY = Math.cos(renderProgress * Math.PI * 10);
                        valToDraw = null;
                    } else if (expType === 'dice') {
                        rot = renderProgress * Math.PI * 4;
                        valToDraw = null;
                    }
                }

                if (expType === 'coin') {
                    drawCoin(cx, cy_anim + 5, scaleY, valToDraw, false);
                } else if (expType === 'biased') {
                    drawCoin(cx, cy_anim + 5, scaleY, valToDraw, true);
                } else if (expType === 'dice') {
                    drawDice(cx, cy_anim + 5, rot, valToDraw);
                }
            } else {
                if (isAnimating && renderProgress < 1) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(cx - 160, cy - 60, 320, 120);
                    ctx.clip();
                    for (let i = 0; i < 18; i++) {
                        let rx = cx - 140 + Math.random() * 280;
                        let ry = cy - 40 + Math.random() * 80;
                        let r_scale = Math.cos(Math.random() * Math.PI * 2 + renderProgress * 20);
                        let r_rot = Math.random() * Math.PI * 2 + renderProgress * 10;
                        ctx.globalAlpha = 0.5;
                        if (expType === 'coin') drawCoin(rx, ry, r_scale, null, false, 0.4);
                        else if (expType === 'biased') drawCoin(rx, ry, r_scale, null, true, 0.4);
                        else drawDice(rx, ry, r_rot, null, 0.4);
                    }
                    ctx.restore();

                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    ctx.fillRect(cx - 160, cy - 60, 320, 120);
                    ctx.fillStyle = '#2b6cb0';
                    ctx.font = 'bold 18px Outfit';
                    ctx.fillText(`${currentTimes.toLocaleString()}번 연속 시행 중...`, cx, cy + 10);
                } else {
                    ctx.fillStyle = '#4a5568';
                    ctx.font = 'bold 16px Outfit';
                    ctx.fillText(runningN > 0 ? `다중 시행 대기 중` : `시행 대기 중`, cx, cy + 10);
                }
            }

            // 타이틀
            const expLabel = expType === 'coin' ? '동전 앞면 비율' : expType === 'dice' ? '주사위 눈 평균' : '편향 동전 앞면 비율';
            ctx.fillStyle = '#2d3748'; ctx.font = 'bold 15px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(`큰수의 법칙 — ${expLabel}`, W / 2, PAD.t - 20);

            // --- 하단 차트 영역 ---
            let band = expType === 'dice' ? 3 : 0.5;
            let yMin = mu - band;
            let yMax = mu + band;

            const gW = W - PAD.l - PAD.r;
            const gH = H - PAD.t - PAD.b;

            function toX(n) {
                if (history.length < 2) return PAD.l + gW * 0.5;
                return PAD.l + (Math.log(n + 1) / Math.log(runningN + 1)) * gW;
            }
            function toY(v) {
                return PAD.t + gH - ((v - yMin) / (yMax - yMin)) * gH;
            }

            const getSigma = () => expType === 'dice' ? Math.sqrt(35 / 12) : (expType === 'coin' ? 0.5 : Math.sqrt(0.3 * 0.7));

            if (history.length >= 2) {
                const sigma = getSigma();
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(72, 187, 120, 0.35)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 3]);
                history.forEach((pt, i) => {
                    const band_n = sigma / Math.sqrt(pt.n);
                    const x = toX(pt.n);
                    const y = toY(mu + band_n);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();

                ctx.beginPath();
                history.forEach((pt, i) => {
                    const band_n = getSigma() / Math.sqrt(pt.n);
                    const x = toX(pt.n);
                    const y = toY(mu - band_n);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // y축 격자선 및 레이블
            ctx.strokeStyle = '#edf2f7';
            ctx.lineWidth = 1;
            ctx.fillStyle = '#718096';
            ctx.font = '12px Outfit, sans-serif';
            ctx.textAlign = 'right';
            const ySteps = 6;
            for (let i = 0; i <= ySteps; i++) {
                const v = yMin + (i / ySteps) * (yMax - yMin);
                const y = toY(v);
                ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke();
                ctx.fillText(v.toFixed(expType === 'dice' ? 1 : 2), PAD.l - 6, y + 4);
            }

            // μ 기준선
            const muY = toY(mu);
            ctx.beginPath();
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 4]);
            ctx.moveTo(PAD.l, muY); ctx.lineTo(W - PAD.r, muY);
            ctx.stroke();
            ctx.setLineDash([]);

            // μ 레이블
            ctx.fillStyle = '#e53e3e';
            ctx.font = 'bold 13px Outfit, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('μ = ' + mu, W - PAD.r + 2, muY + 4);

            // 표본평균 꺾은선
            if (history.length >= 2) {
                ctx.beginPath();
                ctx.strokeStyle = '#3182ce';
                ctx.lineWidth = 2.5;
                ctx.lineJoin = 'round';
                history.forEach((pt, i) => {
                    const x = toX(pt.n);
                    const y = toY(Math.min(Math.max(pt.xbar, yMin), yMax));
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();

                const last = history[history.length - 1];
                const lx = toX(last.n);
                const ly = toY(Math.min(Math.max(last.xbar, yMin), yMax));
                ctx.beginPath();
                ctx.arc(lx, ly, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#3182ce';
                ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            } else {
                ctx.fillStyle = '#a0aec0';
                ctx.font = '16px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('좌측 버튼을 눌러 실험을 시작하세요!', W / 2, PAD.t + gH / 2);
            }

            // x축
            ctx.strokeStyle = '#cbd5e0'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(PAD.l, H - PAD.b); ctx.lineTo(W - PAD.r, H - PAD.b); ctx.stroke();

            // x축 레이블
            ctx.fillStyle = '#718096'; ctx.font = '12px Outfit, sans-serif'; ctx.textAlign = 'center';
            if (runningN > 0) {
                [1, 10, 100, 1000].filter(v => v <= runningN).forEach(v => {
                    const x = toX(v);
                    ctx.beginPath(); ctx.moveTo(x, H - PAD.b); ctx.lineTo(x, H - PAD.b + 5); ctx.stroke();
                    ctx.fillText(v, x, H - PAD.b + 18);
                });
                const x = toX(runningN);
                ctx.beginPath(); ctx.moveTo(x, H - PAD.b); ctx.lineTo(x, H - PAD.b + 5); ctx.stroke();
                ctx.fillText(runningN.toLocaleString(), x, H - PAD.b + 18);
            }

            // x축 제목
            ctx.fillStyle = '#4a5568'; ctx.font = 'bold 13px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('시행 횟수 n (로그 스케일)', W / 2, H - 10);

            // y축 제목
            ctx.save();
            ctx.translate(25, PAD.t + gH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('표본평균 X̄ₙ', 0, 0);
            ctx.restore();

            // 범례
            ctx.fillStyle = '#3182ce'; ctx.font = 'bold 12px Outfit';
            ctx.textAlign = 'left';
            const lx2 = PAD.l + 10, ly2 = PAD.t + 10;
            ctx.beginPath(); ctx.moveTo(lx2, ly2); ctx.lineTo(lx2 + 30, ly2);
            ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.fillText('표본평균 X̄ₙ', lx2 + 35, ly2 + 4);
            ctx.fillStyle = '#e53e3e';
            ctx.beginPath(); ctx.setLineDash([8, 4]); ctx.moveTo(lx2, ly2 + 20); ctx.lineTo(lx2 + 30, ly2 + 20);
            ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
            ctx.fillText('모평균 μ', lx2 + 35, ly2 + 24);
            ctx.fillStyle = '#48bb78';
            ctx.beginPath(); ctx.setLineDash([4, 3]); ctx.moveTo(lx2, ly2 + 40); ctx.lineTo(lx2 + 30, ly2 + 40);
            ctx.strokeStyle = 'rgba(72,187,120,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = '#276749';
            ctx.fillText('μ ± σ/√n', lx2 + 35, ly2 + 44);
        }

        // 실험 타입 버튼
        document.querySelectorAll('.lln-exp-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.lln-exp-btn').forEach(b => {
                    b.style.background = '';
                    b.style.color = '';
                    b.style.borderColor = '';
                });
                this.style.background = '#ebf8ff';
                this.style.color = '#3182ce';
                this.style.borderColor = '#bee3f8';
                expType = this.dataset.exp;
                resetAll();
            });
        });

        document.getElementById('lln-run-1')?.addEventListener('click', () => runExperiment(1));
        document.getElementById('lln-run-10')?.addEventListener('click', () => runExperiment(10));
        document.getElementById('lln-run-100')?.addEventListener('click', () => runExperiment(100));
        document.getElementById('lln-run-1000')?.addEventListener('click', () => runExperiment(1000));
        document.getElementById('lln-reset-btn')?.addEventListener('click', resetAll);

        updateUI();
        draw();
    };
})();

/* ========================================================= */
/* --- 중심극한 정리 (Central Limit Theorem) Logic --- */
/* ========================================================= */
window.initCLT = (function () {
    let _initialized = false;

    return function () {
        if (_initialized) return;
        _initialized = true;

        const popCanvas = document.getElementById('cltPopCanvas');
        const sampleCanvas = document.getElementById('cltSampleCanvas');
        if (!popCanvas || !sampleCanvas) return;
        const popCtx = popCanvas.getContext('2d');
        const sampleCtx = sampleCanvas.getContext('2d');

        // State
        let popType = 'normal'; // normal, uniform, exponential, ushape
        let sampleSize = 30;
        let sampleMeans = [];
        let totalRuns = 0;
        let isAnimating = false;

        // UI Elements
        const distBtns = document.querySelectorAll('.clt-dist-btn');
        const nSlider = document.getElementById('clt-n-slider');
        const nValTxt = document.getElementById('clt-n-val');
        const totalValTxt = document.getElementById('clt-total-val');
        const theoMuTxt = document.getElementById('clt-theo-mu');
        const actualMuTxt = document.getElementById('clt-actual-mu');

        // Distributions parameters (Domain: X in [0, 100])
        const distParams = {
            normal: { mu: 50, sigma: 12, pdf: (x) => Math.exp(-0.5 * Math.pow((x - 50) / 12, 2)) / (12 * Math.sqrt(2 * Math.PI)), gen: () => { let u1 = Math.random(), u2 = Math.random(); return 50 + 12 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); } },
            uniform: { mu: 50, sigma: Math.sqrt(10000 / 12), pdf: (x) => (x >= 0 && x <= 100) ? 0.01 : 0, gen: () => Math.random() * 100 },
            exponential: { mu: 20, sigma: 20, pdf: (x) => (x >= 0) ? 0.05 * Math.exp(-0.05 * x) : 0, gen: () => -Math.log(1 - Math.random()) / 0.05 },
            ushape: { mu: 50, sigma: Math.sqrt(10000 / 8), pdf: (x) => (x > 0 && x < 100) ? 1 / (Math.PI * Math.sqrt(x * (100 - x))) : 0, gen: () => 100 * Math.pow(Math.sin(Math.random() * Math.PI / 2), 2) }
        };

        // Bins for histogram
        const numBins = 50;
        const binWidth = 100 / numBins;
        let histogram = new Array(numBins).fill(0);

        function resetAll() {
            sampleMeans = [];
            histogram.fill(0);
            totalRuns = 0;
            isAnimating = false;
            updateUI();
            draw();
        }

        // UI Event Listeners
        distBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                distBtns.forEach(b => { b.style.background = ''; b.style.color = ''; b.style.borderColor = ''; });
                this.style.background = '#ebf8ff'; this.style.color = '#3182ce'; this.style.borderColor = '#bee3f8';
                popType = this.dataset.dist;
                resetAll();
            });
        });

        nSlider.addEventListener('input', (e) => {
            sampleSize = parseInt(e.target.value);
            nValTxt.innerText = sampleSize;
            resetAll();
        });

        document.getElementById('clt-reset-btn').addEventListener('click', resetAll);

        document.getElementById('clt-run-1').addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;
            // Animation for drawing 1 sample
            let samples = [];
            for (let i = 0; i < sampleSize; i++) samples.push(distParams[popType].gen());
            let mean = samples.reduce((a, b) => a + b) / sampleSize;

            // Draw animation frames
            let startTime = performance.now();
            let duration = 800; // ms
            function animFrame(time) {
                let progress = (time - startTime) / duration;
                if (progress > 1) progress = 1;
                draw(samples, progress);
                if (progress < 1) {
                    requestAnimationFrame(animFrame);
                } else {
                    addMean(mean);
                    isAnimating = false;
                    updateUI();
                    draw();
                }
            }
            requestAnimationFrame(animFrame);
        });

        document.getElementById('clt-run-100').addEventListener('click', () => runBatch(100));
        document.getElementById('clt-run-10000').addEventListener('click', () => runBatch(10000));

        function runBatch(times) {
            if (isAnimating) return;
            const batchSize = Math.max(10, Math.floor(times / 20));
            let current = 0;
            isAnimating = true;

            function step() {
                let runs = Math.min(batchSize, times - current);
                for (let i = 0; i < runs; i++) {
                    let sum = 0;
                    for (let j = 0; j < sampleSize; j++) sum += distParams[popType].gen();
                    addMean(sum / sampleSize);
                }
                current += runs;
                updateUI();
                draw();
                if (current < times) {
                    requestAnimationFrame(step);
                } else {
                    isAnimating = false;
                }
            }
            requestAnimationFrame(step);
        }

        function addMean(mean) {
            sampleMeans.push(mean);
            totalRuns++;
            let binIdx = Math.floor(mean / binWidth);
            if (binIdx < 0) binIdx = 0;
            if (binIdx >= numBins) binIdx = numBins - 1;
            histogram[binIdx]++;
        }

        function updateUI() {
            totalValTxt.innerText = totalRuns.toLocaleString();
            let p = distParams[popType];
            theoMuTxt.innerText = p.mu.toFixed(2);
            if (totalRuns > 0) {
                let actualMu = sampleMeans.reduce((a, b) => a + b) / totalRuns;
                actualMuTxt.innerText = actualMu.toFixed(2);
            } else {
                actualMuTxt.innerText = "-";
            }
        }

        function draw(animSamples = null, animProgress = 0) {
            popCtx.clearRect(0, 0, popCanvas.width, popCanvas.height);
            sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);

            const W = popCanvas.width;
            const H = popCanvas.height;
            const padL = 30, padR = 30, padB = 30, padT = 20;
            const gW = W - padL - padR;
            const gH = H - padB - padT;

            function toX(x) { return padL + (x / 100) * gW; }
            function toY(y, maxH, canvasH) { return canvasH - padB - (y / maxH) * gH; }

            // 1. Draw Population Distribution
            let p = distParams[popType];
            let maxPdf = popType === 'uniform' ? 0.02 : (popType === 'normal' ? 0.04 : (popType === 'exponential' ? 0.06 : 0.05));
            if (popType === 'ushape') maxPdf = 0.05;

            popCtx.beginPath();
            popCtx.moveTo(toX(0), toY(0, maxPdf, H));
            for (let x = 0.1; x <= 99.9; x += 0.5) {
                let y = p.pdf(x);
                if (popType === 'ushape' && (x < 1 || x > 99)) y = Math.min(y, 0.05); // cap at 0.05 for visual
                popCtx.lineTo(toX(x), toY(y, maxPdf, H));
            }
            popCtx.lineTo(toX(100), toY(0, maxPdf, H));
            popCtx.fillStyle = 'rgba(115, 165, 255, 0.2)';
            popCtx.fill();
            popCtx.strokeStyle = '#3182ce';
            popCtx.lineWidth = 2;
            popCtx.stroke();

            // Draw x-axis
            popCtx.beginPath(); popCtx.moveTo(padL, H - padB); popCtx.lineTo(W - padR, H - padB);
            popCtx.strokeStyle = '#cbd5e0'; popCtx.lineWidth = 2; popCtx.stroke();
            popCtx.fillStyle = '#718096'; popCtx.font = '12px Outfit'; popCtx.textAlign = 'center';
            for (let i = 0; i <= 100; i += 20) {
                popCtx.fillText(i, toX(i), H - padB + 15);
            }

            // Draw animSamples if any
            if (animSamples && animProgress <= 0.5) {
                popCtx.fillStyle = '#e53e3e';
                animSamples.forEach(val => {
                    popCtx.beginPath();
                    popCtx.arc(toX(val), H - padB, 4, 0, Math.PI * 2);
                    popCtx.fill();
                });
            } else if (animSamples && animProgress > 0.5) {
                // Collect them to the mean in the sample canvas
                let mean = animSamples.reduce((a, b) => a + b) / sampleSize;
                let dropProgress = (animProgress - 0.5) * 2; // 0 to 1
                sampleCtx.fillStyle = '#e53e3e';
                animSamples.forEach(val => {
                    let curX = toX(val) + (toX(mean) - toX(val)) * dropProgress;
                    let curY = padT + (sampleCanvas.height - padB - padT) * dropProgress;
                    sampleCtx.beginPath();
                    sampleCtx.arc(curX, curY, 4, 0, Math.PI * 2);
                    sampleCtx.fill();
                });
            }

            // 2. Draw Sample Means Histogram
            let maxCount = Math.max(...histogram, 10);
            if (totalRuns > 0) {
                maxCount = Math.max(...histogram) * 1.2;
            }

            sampleCtx.fillStyle = '#68d391';
            sampleCtx.strokeStyle = '#fff';
            sampleCtx.lineWidth = 1;
            for (let i = 0; i < numBins; i++) {
                if (histogram[i] > 0) {
                    let barX = toX(i * binWidth);
                    let barW = toX((i + 1) * binWidth) - barX;
                    let barH = (histogram[i] / maxCount) * gH;
                    sampleCtx.fillRect(barX, sampleCanvas.height - padB - barH, barW, barH);
                    sampleCtx.strokeRect(barX, sampleCanvas.height - padB - barH, barW, barH);
                }
            }

            // Draw x-axis
            sampleCtx.beginPath(); sampleCtx.moveTo(padL, sampleCanvas.height - padB); sampleCtx.lineTo(W - padR, sampleCanvas.height - padB);
            sampleCtx.strokeStyle = '#cbd5e0'; sampleCtx.lineWidth = 2; sampleCtx.stroke();
            sampleCtx.fillStyle = '#718096'; sampleCtx.font = '12px Outfit'; sampleCtx.textAlign = 'center';
            for (let i = 0; i <= 100; i += 20) {
                sampleCtx.fillText(i, toX(i), sampleCanvas.height - padB + 15);
            }

            // Draw theoretical Normal Distribution
            if (totalRuns > 0) {
                let cltSigma = p.sigma / Math.sqrt(sampleSize);
                let cltMu = p.mu;
                let area = totalRuns * binWidth;

                sampleCtx.beginPath();
                for (let x = 0; x <= 100; x += 0.5) {
                    let pdf = Math.exp(-0.5 * Math.pow((x - cltMu) / cltSigma, 2)) / (cltSigma * Math.sqrt(2 * Math.PI));
                    let count = pdf * area;
                    let y = sampleCanvas.height - padB - (count / maxCount) * gH;
                    if (x === 0) sampleCtx.moveTo(toX(x), y);
                    else sampleCtx.lineTo(toX(x), y);
                }
                sampleCtx.strokeStyle = '#e53e3e';
                sampleCtx.lineWidth = 2;
                sampleCtx.stroke();
            }
        }

        updateUI();
        draw();
    };
})();

/* ========================================================= */
/* --- 벤다이어그램 (Venn Diagram) Logic --- */
/* ========================================================= */
window.initVenn = (function () {
    let _initialized = false;
    return function () {
        if (_initialized) return;
        _initialized = true;

        const canvas = document.getElementById('vennCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        let pa = 0.4, pb = 0.3, overlapRatio = 0.5;

        function drawVenn() {
            ctx.clearRect(0, 0, W, H);

            // 전체 집합 S
            ctx.strokeStyle = '#cbd5e0'; ctx.lineWidth = 2;
            ctx.strokeRect(50, 50, W - 100, H - 100);
            ctx.fillStyle = '#4a5568'; ctx.font = 'bold 20px Outfit';
            ctx.fillText('S (표본공간)', 70, 80);

            // 확률 크기에 비례하는 반지름 (시각적 스케일)
            const maxR = 160;
            const rA = Math.sqrt(pa) * maxR;
            const rB = Math.sqrt(pb) * maxR;

            // 중심 좌표 계산
            const centerY = H / 2;
            const minX = W / 2 - (rA + rB) / 2;
            const maxX = W / 2 + Math.abs(rA - rB) / 2;

            // overlapRatio (0: 배반사건, 1: 완전 포함)
            const d = (rA + rB) - (overlapRatio * 2 * Math.min(rA, rB));
            const cAx = W / 2 - d * (rB / (rA + rB));
            const cBx = W / 2 + d * (rA / (rA + rB));

            // 교집합 넓이 근사치 계산 (시각용)
            const pIntersect = overlapRatio * Math.min(pa, pb);
            const pUnion = pa + pb - pIntersect;

            // 원 A 그리기
            ctx.beginPath(); ctx.arc(cAx, centerY, rA, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(229, 62, 62, 0.4)'; // Red
            ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#c53030'; ctx.stroke();

            // 원 B 그리기
            ctx.beginPath(); ctx.arc(cBx, centerY, rB, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(49, 130, 206, 0.4)'; // Blue
            ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2b6cb0'; ctx.stroke();

            // 텍스트 라벨
            ctx.fillStyle = '#c53030'; ctx.textAlign = 'center'; ctx.font = 'bold 22px Outfit';
            ctx.fillText(`A (${pa.toFixed(2)})`, cAx - rA / 2, centerY);

            ctx.fillStyle = '#2b6cb0';
            ctx.fillText(`B (${pb.toFixed(2)})`, cBx + rB / 2, centerY);

            if (pIntersect > 0.01) {
                ctx.fillStyle = '#553c9a'; ctx.font = 'bold 16px Outfit';
                ctx.fillText(`${pIntersect.toFixed(2)}`, (cAx + cBx) / 2, centerY);
            }

            // 하단 수식 업데이트
            document.getElementById('venn-result-eq').innerHTML =
                `${pUnion.toFixed(2)} <br> = ${pa.toFixed(2)} + ${pb.toFixed(2)} - ${pIntersect.toFixed(2)}`;
        }

        document.getElementById('venn-pa-slider').addEventListener('input', (e) => {
            pa = parseFloat(e.target.value);
            document.getElementById('venn-pa-val').innerText = pa.toFixed(2);
            drawVenn();
        });
        document.getElementById('venn-pb-slider').addEventListener('input', (e) => {
            pb = parseFloat(e.target.value);
            document.getElementById('venn-pb-val').innerText = pb.toFixed(2);
            drawVenn();
        });
        document.getElementById('venn-dist-slider').addEventListener('input', (e) => {
            overlapRatio = parseFloat(e.target.value);
            drawVenn();
        });

        drawVenn();
    };
})();

/* ========================================================= */
/* --- 모평균 추정 (Confidence Interval Simulator) --- */
/* ========================================================= */
window.initConf = (function () {
    let _initialized = false;
    return function () {
        if (_initialized) return;
        _initialized = true;

        const canvas = document.getElementById('confCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        // 상태 관리 객체 (보내주신 구조 그대로 사용)
        const state = {
            mu: 100,
            sigma: 20,
            n: 30,
            confidence: 0.95,
            k: 1.96,
            results: [],
            total: 0,
            success: 0,
            isAuto: false,
            maxDisplay: 40 // 화면 높이에 맞게 표시 개수 조정
        };

        let autoTimer = null;

        // Box-Muller Transform 난수 생성
        function randomNormal() {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        }

        function takeSample() {
            let sum = 0;
            for (let i = 0; i < state.n; i++) {
                sum += state.mu + randomNormal() * state.sigma;
            }

            const xBar = sum / state.n;
            const se = state.sigma / Math.sqrt(state.n);
            const marginOfError = state.k * se;

            const lower = xBar - marginOfError;
            const upper = xBar + marginOfError;
            const isSuccess = lower <= state.mu && upper >= state.mu;

            // 새 결과를 배열 맨 앞에 추가 (최신 데이터가 위로 오게)
            state.results.unshift({ xBar, lower, upper, isSuccess });
            if (state.results.length > state.maxDisplay) state.results.pop();

            state.total++;
            if (isSuccess) state.success++;

            updateUI();
            drawConf();
        }

        function drawConf() {
            ctx.clearRect(0, 0, W, H);

            // 배경 다크 처리
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, W, H);

            // 유동적 스케일링: 시그마(산포도) 크기에 맞춰 캔버스 너비 동적 조절
            const visibleRange = state.sigma * 4;
            const scale = (W / 2) / visibleRange;
            const centerX = W / 2;

            // 1. 모평균 가이드라인 (점선)
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, H);
            ctx.stroke();
            ctx.setLineDash([]);

            // 2. 신뢰구간 막대 그리기
            state.results.forEach((res, i) => {
                const y = 50 + i * ((H - 80) / state.maxDisplay);
                const xStart = centerX + (res.lower - state.mu) * scale;
                const xEnd = centerX + (res.upper - state.mu) * scale;
                const xBarPos = centerX + (res.xBar - state.mu) * scale;

                // 성공(포함): 초록, 실패(미포함): 빨강
                const color = res.isSuccess ? '#22c55e' : '#ef4444';
                const opacity = 1 - (i / state.maxDisplay); // 페이드아웃 효과

                ctx.strokeStyle = color;
                ctx.globalAlpha = opacity;
                ctx.lineWidth = 2.5;

                // 수평선
                ctx.beginPath();
                ctx.moveTo(xStart, y);
                ctx.lineTo(xEnd, y);
                ctx.stroke();

                // 수직 캡 (I 모양)
                ctx.beginPath();
                ctx.moveTo(xStart, y - 4); ctx.lineTo(xStart, y + 4);
                ctx.moveTo(xEnd, y - 4); ctx.lineTo(xEnd, y + 4);
                ctx.stroke();

                // 표본평균 점
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(xBarPos, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        function updateUI() {
            document.getElementById('conf-total-val').innerText = state.total.toLocaleString();
            document.getElementById('conf-hit-val').innerText = state.success.toLocaleString();
            const rate = state.total === 0 ? 0 : ((state.success / state.total) * 100);
            document.getElementById('conf-ratio-val').innerText = rate.toFixed(1) + '%';
        }

        function resetAll() {
            state.total = 0;
            state.success = 0;
            state.results = [];
            if (state.isAuto) {
                document.getElementById('conf-run-auto').click(); // 자동 추출 중지
            }
            updateUI();
            drawConf();
        }

        // --- 이벤트 연결 ---
        document.getElementById('conf-mu-slider').addEventListener('input', (e) => {
            state.mu = parseInt(e.target.value);
            document.getElementById('conf-mu-val').innerText = state.mu;
            drawConf(); // 스케일이 달라지므로 즉시 다시 그림
        });
        document.getElementById('conf-sigma-slider').addEventListener('input', (e) => {
            state.sigma = parseInt(e.target.value);
            document.getElementById('conf-sigma-val').innerText = state.sigma;
            drawConf();
        });
        document.getElementById('conf-n-slider').addEventListener('input', (e) => {
            state.n = parseInt(e.target.value);
            document.getElementById('conf-n-val').innerText = state.n;
        });
        document.getElementById('conf-level-select').addEventListener('change', (e) => {
            state.confidence = parseInt(e.target.value) / 100;
            state.k = state.confidence === 0.95 ? 1.96 : 2.58;
        });

        // 버튼 이벤트
        document.getElementById('conf-run-1').addEventListener('click', takeSample);
        document.getElementById('conf-reset').addEventListener('click', resetAll);

        const btnAuto = document.getElementById('conf-run-auto');
        btnAuto.addEventListener('click', () => {
            state.isAuto = !state.isAuto;
            if (state.isAuto) {
                btnAuto.innerText = "자동 추출 중지 ⏸";
                btnAuto.style.background = "linear-gradient(135deg, #ef4444, #b91c1c)"; // 빨간색 계열로 변경
                autoTimer = setInterval(takeSample, 100); // 100ms 마다 추출
            } else {
                btnAuto.innerText = "자동 추출 시작 ▶";
                btnAuto.style.background = "linear-gradient(135deg, #a78bfa, #8b5cf6)";
                clearInterval(autoTimer);
            }
        });

        // 초기 실행
        drawConf();
    };
})();

document.addEventListener("DOMContentLoaded", () => {

    /* ── 탭 키 → 그룹 키 매핑 ── */
    const TAB_GROUP = {
        pascal: 'count',
        binom: 'count',
        venn: 'prob',
        monty: 'prob',
        galton: 'dist',
        normal: 'dist',
        lln: 'stat',
        clt: 'stat',
        conf: 'stat'
    };

    const panels = {
        monty: document.getElementById('prob-panel-monty'),
        pascal: document.getElementById('prob-panel-pascal'),
        binom: document.getElementById('prob-panel-binom'),
        galton: document.getElementById('prob-panel-galton'),
        normal: document.getElementById('prob-panel-normal'),
        lln: document.getElementById('prob-panel-lln'),
        clt: document.getElementById('prob-panel-clt'),
        venn: document.getElementById('prob-panel-venn'),
        conf: document.getElementById('prob-panel-conf')
    };
    const canvasWraps = {
        monty: document.getElementById('canvas-wrap-monty'),
        pascal: document.getElementById('canvas-wrap-pascal'),
        binom: document.getElementById('canvas-wrap-binom'),
        galton: document.getElementById('canvas-wrap-galton'),
        normal: document.getElementById('canvas-wrap-normal'),
        lln: document.getElementById('canvas-wrap-lln'),
        clt: document.getElementById('canvas-wrap-clt'),
        venn: document.getElementById('canvas-wrap-venn'),
        conf: document.getElementById('canvas-wrap-conf')
    };

    /* ── 드롭다운 nav 아이템 클릭 → showTab ── */
    document.querySelectorAll('.prob-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            showTab(item.dataset.probtab);
            document.querySelectorAll('.prob-nav-group').forEach(g => g.classList.remove('open'));
        });
    });

    /* ── 그룹 버튼 클릭: 드롭다운 토글 ── */
    document.querySelectorAll('.prob-nav-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const group = btn.closest('.prob-nav-group');
            const isOpen = group.classList.contains('open');
            document.querySelectorAll('.prob-nav-group').forEach(g => g.classList.remove('open'));
            if (!isOpen) group.classList.add('open');
        });
    });

    /* 외부 클릭 시 닫기 — mousedown 사용: click보다 먼저 실행되지 않으면서 item click의 stopPropagation을 우회하지 않음 */
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.prob-nav-group')) {
            document.querySelectorAll('.prob-nav-group').forEach(g => g.classList.remove('open'));
        }
    });

    /* ── 핵심 showTab 함수 ── */
    function showTab(targetTab) {
        /* 패널·캔버스 숨기기 */
        Object.values(panels).forEach(p => { if (p) p.style.display = 'none'; });
        Object.values(canvasWraps).forEach(c => { if (c) c.style.display = 'none'; });

        /* 드롭다운 nav 동기화 */
        const activeGroup = TAB_GROUP[targetTab];
        document.querySelectorAll('.prob-nav-group-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.navgroup === activeGroup);
        });
        document.querySelectorAll('.prob-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.probtab === targetTab);
        });

        /* 패널·캔버스 보이기 */
        if (panels[targetTab]) panels[targetTab].style.display = 'block';
        if (canvasWraps[targetTab]) canvasWraps[targetTab].style.display = 'block';

        /* 이항정리 공식박스 */
        const formulaBox = document.getElementById('binomial-formula-box');
        if (formulaBox) formulaBox.style.display =
            (targetTab === 'pascal' && window.pascalCurrentMode === 'binomial') ? 'block' : 'none';

        /* 각 탭 초기화 함수 호출 */
        if (targetTab === 'pascal' && window.initPascal) window.initPascal();
        if (targetTab === 'comb' && window.initBinom) window.initBinom();
        if (targetTab === 'binom' && window.initBinom) window.initBinom();
        if (targetTab === 'monty' && window.initProb) window.initProb();
        if (targetTab === 'galton' && window.initGalton) window.initGalton();
        if (targetTab === 'normal' && window.initNormal) window.initNormal();
        if (targetTab === 'lln' && window.initLLN) window.initLLN();
        if (targetTab === 'clt' && window.initCLT) window.initCLT();
        if (targetTab === 'venn' && window.initVenn) window.initVenn();
        if (targetTab === 'conf' && window.initConf) window.initConf();

        window.probCurrentTab = targetTab;
    }

    /* ── 전역 노출 ── */
    window.probShowTab = showTab;
    window.probCurrentTab = 'pascal';

    showTab('pascal');
});