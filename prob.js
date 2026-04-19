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

        // 고속 자동 시뮬레이션 함수
        function runSimulation(times) {
            let stayW = 0, stayL = 0;
            let switchW = 0, switchL = 0;

            for (let i = 0; i < times; i++) {
                // 1. 차 배치 & 내 선택
                let p = Math.floor(Math.random() * 3);
                let s = Math.floor(Math.random() * 3);

                // 2. 사회자가 여는 문 (p와 s가 아닌 것)
                let avail = [0, 1, 2].filter(d => d !== p && d !== s);
                let o = avail[Math.floor(Math.random() * avail.length)];

                // 3. 유지(Stay) 했을 때 결과
                if (s === p) stayW++; else stayL++;

                // 4. 바꿨을(Switch) 때 결과
                let newS = [0, 1, 2].find(d => d !== s && d !== o);
                if (newS === p) switchW++; else switchL++;
            }

            // 누적 반영
            stats.total += (times * 2); // 유지 1번, 변경 1번씩 해본 것으로 간주
            stats.stayWins += stayW; stats.stayLosses += stayL;
            stats.switchWins += switchW; stats.switchLosses += switchL;

            updateStatsUI();

            // 시각적 피드백
            updateMessage(`🤖 <strong>${times.toLocaleString()}번</strong> 자동 시뮬레이션 완료!`, '#805ad5');

            // 전광판 반짝임 효과
            const statBox = stayRateTxt.parentElement.parentElement;
            statBox.style.background = '#e9d8fd'; statBox.style.borderColor = '#b794f4';
            setTimeout(() => {
                statBox.style.background = '#fff5f5'; statBox.style.borderColor = '#fed7d7';
            }, 300);
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