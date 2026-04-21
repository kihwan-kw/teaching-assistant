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
            if (gameState !== 0) return; // 문을 고르는 상태가 아니면 무시

            const rect = pCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 어떤 문을 클릭했는지 판별
            for (let i = 0; i < 3; i++) {
                let dx = startX + i * (doorW + gap);
                let dy = startY;
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

            if (isWin) {
                updateMessage(`🎉 <strong>자동차 당첨!</strong> (선택 ${actionStr} 성공)`, '#38a169');
            } else {
                updateMessage(`😭 <strong>염소 당첨...</strong> (선택 ${actionStr} 실패)`, '#e53e3e');
            }
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
                stats.total += (actualRuns * 2);
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

                let isLeftHalf = (r <= n / 2);
                let currN = n - 1;
                let currR = isLeftHalf ? r - 1 : r;
                let nodes = [];

                // 1. 선택한 꼭짓점(결과값)부터 시작하여 대각선 위로 올라가며 노드 수집
                while (true) {
                    nodes.push({ n: currN, r: currR, val: getComb(currN, currR) });
                    if (isLeftHalf) { if (currN === currR) break; currN--; }
                    else { if (currR === 0) break; currN--; currR--; }
                }
                nodes.reverse(); // 위에서 아래로 순서 뒤집기

                // 2. 조합 기호(nCr) 식 만들기
                let combHTML = nodes.length <= 5 ?
                    nodes.map(nd => `<sub>${nd.n}</sub>C<sub>${nd.r}</sub>`).join(' + ') :
                    `<sub>${nodes[0].n}</sub>C<sub>${nodes[0].r}</sub> + <sub>${nodes[1].n}</sub>C<sub>${nodes[1].r}</sub> + ··· + <sub>${nodes[nodes.length - 1].n}</sub>C<sub>${nodes[nodes.length - 1].r}</sub>`;

                let finalCombHTML = `<sub>${n}</sub>C<sub>${r}</sub>`;

                // 3. 실제 계산된 숫자 식 만들기
                let stickValsHTML = nodes.length <= 5 ?
                    nodes.map(nd => nd.val).join(' + ') :
                    `${nodes[0].val} + ${nodes[1].val} + ··· + ${nodes[nodes.length - 1].val}`;

                // 4. 화면 출력 (2줄 레이아웃)
                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                        <span style="font-size:15px; color:#718096; font-weight:700;">하키스틱 패턴 조합의 합</span>
                        
                        <!-- 첫 번째 줄: 조합(nCr) 식 -->
                        <div style="font-size: 18px; color: #4a5568; margin-top: 5px;">
                            <span class="pascal-hl-blue">${combHTML}</span> = <span class="pascal-hl-red">${finalCombHTML}</span>
                        </div>
                        
                        <!-- 두 번째 줄: 계산된 숫자 식 -->
                        <div style="font-size: 20px; margin-top: 2px;">
                            <span class="pascal-hl-blue">${stickValsHTML}</span> = <span class="pascal-hl-red">${val}</span>
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const layout = getLayoutInfo();

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
                        hlNodes[`${hoverNode.n},${hoverNode.r}`] = 'sum';
                        let isLeftHalf = (hoverNode.r <= hoverNode.n / 2);
                        let currN = hoverNode.n - 1;
                        let currR = isLeftHalf ? hoverNode.r - 1 : hoverNode.r;

                        while (true) {
                            hlNodes[`${currN},${currR}`] = 'stick';
                            if (isLeftHalf) { if (currN === currR) break; currN--; }
                            else { if (currR === 0) break; currN--; currR--; }
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

    return function () {
        if (_initialized) {
            drawNormal(); // 재진입 시 재렌더링
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

        drawNormal();
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    const probTabs = document.querySelectorAll('#idx-prob .index-tab');
    const panels = {
        monty: document.getElementById('prob-panel-monty'),
        pascal: document.getElementById('prob-panel-pascal'),
        galton: document.getElementById('prob-panel-galton'),
        normal: document.getElementById('prob-panel-normal'),
    };
    const canvasWraps = {
        monty: document.getElementById('canvas-wrap-monty'),
        pascal: document.getElementById('canvas-wrap-pascal'),
        galton: document.getElementById('canvas-wrap-galton'),
        normal: document.getElementById('canvas-wrap-normal'),
    };

    function showTab(targetTab) {
        /* 모든 패널 숨기기 */
        Object.values(panels).forEach(p => { if (p) p.style.display = 'none'; });
        Object.values(canvasWraps).forEach(c => { if (c) c.style.display = 'none'; });

        /* 탭 버튼 active 처리 */
        probTabs.forEach(t =>
            t.classList.toggle('active', t.dataset.probtab === targetTab)
        );

        /* 해당 패널 보이기 */
        if (panels[targetTab]) panels[targetTab].style.display = 'block';
        if (canvasWraps[targetTab]) canvasWraps[targetTab].style.display = 'block';

        const formulaBox = document.getElementById('binomial-formula-box');
        if (formulaBox) formulaBox.style.display = targetTab === 'pascal' ? 'block' : 'none';

        /* 초기화 */
        if (targetTab === 'pascal' && window.initPascal) window.initPascal();
        if (targetTab === 'monty' && window.initProb) window.initProb();
        if (targetTab === 'galton' && window.initGalton) window.initGalton();
        if (targetTab === 'normal' && window.initNormal) window.initNormal();
    }

    /* 탭 클릭 이벤트 */
    probTabs.forEach(tab => {
        tab.addEventListener('click', e => showTab(e.target.dataset.probtab));
    });

    /* ★ 첫 진입 시 파스칼 탭을 기본으로 활성화 */
    showTab('pascal');
});