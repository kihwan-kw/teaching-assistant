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

            stayRateTxt.innerText = stayRate.toFixed(1) + '%';
            switchRateTxt.innerText = switchRate.toFixed(1) + '%';
            totalSimTxt.innerText = stats.total.toLocaleString();
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
            statBox.style.background = '#e9d8fd';
            statBox.style.borderColor = '#b794f4';
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
        let mode = 'basic'; // 'basic', 'rowSum', 'hockey', 'sierpinski', 'fibonacci', 'polygonal'
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
            draw();
        });

        // 마우스 이벤트 (Hover 추적)
        canvas.addEventListener('mousemove', (e) => {
            if (mode === 'sierpinski') return; // 프랙탈 모드는 마우스 오버 불필요

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

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
                    draw();
                }
            }
        });

        canvas.addEventListener('mouseleave', () => {
            hoverNode = null;
            if (mode !== 'sierpinski') {
                updateFormulaBox();
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

                while (true) {
                    nodes.push({ n: currN, r: currR, val: getComb(currN, currR) });
                    if (isLeftHalf) { if (currN === currR) break; currN--; }
                    else { if (currR === 0) break; currN--; currR--; }
                }
                nodes.reverse();

                let stickValsHTML = nodes.length <= 5 ?
                    nodes.map(nd => nd.val).join(' + ') :
                    `${nodes[0].val} + ${nodes[1].val} + ··· + ${nodes[nodes.length - 2].val} + ${nodes[nodes.length - 1].val}`;

                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                        <span style="font-size:15px; color:#718096; font-weight:700;">하키스틱 패턴 조합의 합</span>
                        <div style="font-size: 20px;">
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
            else if (mode === 'polygonal') {
                // 대칭이므로 왼쪽 축(r)인지 오른쪽 축(n-r)인지 확인
                let distFromEdge = Math.min(r, n - r);
                let title = "";
                let desc = "";

                if (distFromEdge === 0) { title = "1의 배열"; desc = "가장자리는 항상 1입니다."; }
                else if (distFromEdge === 1) { title = "자연수"; desc = "1, 2, 3, 4, 5... 자연수가 이어집니다."; }
                else if (distFromEdge === 2) { title = "삼각수 (Triangular Numbers)"; desc = "점을 정삼각형 모양으로 찍을 때 필요한 개수 (1, 3, 6, 10...)"; }
                else if (distFromEdge === 3) { title = "사면체수 (Tetrahedral Numbers)"; desc = "공을 입체 정사면체로 쌓을 때 필요한 개수 (1, 4, 10, 20...)"; }
                else { title = `${distFromEdge + 1}차원 다각수`; desc = `고차원 도형을 구성하는 수 배열입니다.`; }

                formulaBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center;">
                        <span style="font-size:18px; color:#2b6cb0; font-weight:800;">${title}</span>
                        <div style="font-size:14px; color:#4a5568;">
                            선택하신 값: <strong style="color:#e53e3e; font-size:18px;">${val}</strong><br>
                            <span style="color:#718096; font-size:13px;">${desc}</span>
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

                    // 프랙탈 모드에서 층수가 너무 높으면 글씨 생략 (도형만 예쁘게 보이게)
                    if (mode === 'sierpinski' && numRows > 12) {
                        // 글씨 안 그림
                    } else {
                        ctx.fillStyle = textCol;
                        if (val > 999) ctx.font = `bold ${Math.max(8, layout.hexRadius * 0.5)}px Outfit`;
                        else ctx.font = `bold ${Math.max(10, layout.hexRadius * 0.7)}px Outfit`;
                        ctx.fillText(val, cx, cy);
                    }
                }
            }
        }

        draw(); // 초기 렌더링
    };
})();

/* 확률 단원 내부 탭 전환 로직 (몬티홀 <-> 파스칼) */
document.addEventListener("DOMContentLoaded", () => {
    // 확률 단원 탭 버튼들
    const probTabs = document.querySelectorAll('#idx-prob .index-tab');
    const probPanelMonty = document.getElementById('prob-panel-monty');
    const probPanelPascal = document.getElementById('prob-panel-pascal');
    const canvasWrapMonty = document.getElementById('canvas-wrap-monty');
    const canvasWrapPascal = document.getElementById('canvas-wrap-pascal');

    probTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // 모든 탭 비활성화
            probTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            const targetTab = e.target.dataset.probtab;

            if (targetTab === 'monty') {
                probPanelPascal.style.display = 'none';
                canvasWrapPascal.style.display = 'none';

                probPanelMonty.style.display = 'block';
                canvasWrapMonty.style.display = 'block';
                if (window.initProb) window.initProb();
            }
            else if (targetTab === 'pascal') {
                probPanelMonty.style.display = 'none';
                canvasWrapMonty.style.display = 'none';

                probPanelPascal.style.display = 'block';
                canvasWrapPascal.style.display = 'block';
                if (window.initPascal) window.initPascal();
            }
        });
    });
});