/* ========================================================= */
/* --- Derivative (미분) Logic --- */
/* 기하적 의미 (교과서 맞춤 UI) */
/* ========================================================= */

(function () {
    let tCanvas, tCtx, tWidth, tHeight;
    let gCanvas, gCtx, gWidth, gHeight;

    // --- 1. 생각 열기 (Think Open) 상태 변수 ---
    const tFunc = (x) => x * x - x + 1; // y = x^2 - x + 1
    const tPointA = { x: 1, y: 1 };
    let tPointP_x = 2; // 초기값

    // --- 2. 기하적 의미 상태 변수 ---
    const gFunc = (x) => 0.15 * x * x + 0.2 * x + 1;
    const gPointA_x = 2;
    let gDeltaX = 3.5; // 초기값 (slider가 1일 때)

    /* 캔버스 좌표계 변환 함수 */
    // 생각열기 캔버스 좌표계: x: -1 ~ 4, y: -0.5 ~ 4.5
    function tx(mathX) { return (mathX + 1) * (tWidth / 5); }
    function ty(mathY) { return tHeight - (mathY + 0.5) * (tHeight / 5); }

    // 기하적 의미 캔버스 좌표계: x: -1 ~ 6, y: -1 ~ 6
    function gx(mathX) { return (mathX + 1) * (gWidth / 7); }
    function gy(mathY) { return gHeight - (mathY + 1) * (gHeight / 7); }

    /* ========================================================= */
    /* --- 생각 열기 (Think Open) 렌더링 --- */
    /* ========================================================= */
    function renderThinkOpen() {
        if (!tCtx) return;
        tCtx.clearRect(0, 0, tWidth, tHeight);

        // 1. 그리드 및 축
        tCtx.lineWidth = 1;
        tCtx.strokeStyle = '#e2e8f0';
        for (let i = -1; i <= 4; i++) {
            tCtx.beginPath(); tCtx.moveTo(tx(i), 0); tCtx.lineTo(tx(i), tHeight); tCtx.stroke();
        }
        for (let i = 0; i <= 4; i++) {
            tCtx.beginPath(); tCtx.moveTo(0, ty(i)); tCtx.lineTo(tWidth, ty(i)); tCtx.stroke();
        }

        tCtx.strokeStyle = '#a0aec0'; tCtx.lineWidth = 2;
        tCtx.beginPath(); tCtx.moveTo(0, ty(0)); tCtx.lineTo(tWidth, ty(0)); // x축
        tCtx.moveTo(tx(0), 0); tCtx.lineTo(tx(0), tHeight); // y축
        tCtx.stroke();

        // 라벨
        tCtx.fillStyle = '#718096'; tCtx.font = '12px Outfit';
        tCtx.fillText('O', tx(0) - 15, ty(0) + 15);
        tCtx.fillText('x', tWidth - 15, ty(0) + 15);
        tCtx.fillText('y', tx(0) - 15, 15);

        // 2. 포물선 그리기
        tCtx.beginPath();
        tCtx.strokeStyle = '#3182ce'; // 파란색
        tCtx.lineWidth = 3;
        for (let x = -1; x <= 4; x += 0.05) {
            let px = tx(x); let py = ty(tFunc(x));
            if (x === -1) tCtx.moveTo(px, py);
            else tCtx.lineTo(px, py);
        }
        tCtx.stroke();

        tCtx.fillStyle = '#3182ce';
        tCtx.font = 'bold 16px Outfit';
        tCtx.fillText('y = x² - x + 1', tx(2), ty(3.5));

        // 3. 접선 (y = x) 그리기
        tCtx.beginPath();
        tCtx.strokeStyle = '#38a169'; // 녹색
        tCtx.lineWidth = 2;
        tCtx.moveTo(tx(-0.5), ty(-0.5));
        tCtx.lineTo(tx(4), ty(4));
        tCtx.stroke();

        tCtx.fillStyle = '#38a169';
        tCtx.fillText('y = x', tx(3.5), ty(3.1));

        // 4. 할선 AP 그리기
        let P_y = tFunc(tPointP_x);
        let m = (tPointP_x === 1) ? 1 : (P_y - tPointA.y) / (tPointP_x - tPointA.x);
        let n = tPointA.y - m * tPointA.x;

        tCtx.beginPath();
        tCtx.strokeStyle = '#e53e3e'; // 빨간색
        tCtx.lineWidth = 2;
        tCtx.moveTo(tx(-1), ty(m * -1 + n));
        tCtx.lineTo(tx(4), ty(m * 4 + n));
        tCtx.stroke();

        // 5. 점 A, P 그리기 및 라벨
        tCtx.beginPath(); tCtx.arc(tx(tPointA.x), ty(tPointA.y), 6, 0, 2 * Math.PI);
        tCtx.fillStyle = '#38a169'; tCtx.fill(); tCtx.strokeStyle = '#fff'; tCtx.lineWidth = 2; tCtx.stroke();

        tCtx.beginPath(); tCtx.arc(tx(tPointP_x), ty(P_y), 6, 0, 2 * Math.PI);
        tCtx.fillStyle = '#e53e3e'; tCtx.fill(); tCtx.stroke();

        tCtx.fillStyle = '#2d3748';
        tCtx.font = 'bold 14px Outfit';
        tCtx.fillText('A(1, 1)', tx(tPointA.x) + 12, ty(tPointA.y) + 6);

        tCtx.textAlign = 'right';
        tCtx.fillText(`P(${tPointP_x.toFixed(2)}, ${P_y.toFixed(2)})`, tx(tPointP_x) - 10, ty(P_y) - 10);
        tCtx.textAlign = 'left'; // reset

        // 6. UI 문자열 업데이트
        let xValEl = document.getElementById('deriv-think-x-val');
        if (xValEl) xValEl.innerText = tPointP_x.toFixed(3);

        let nStr = (n < 0) ? `- ${Math.abs(n).toFixed(2)}` : `+ ${n.toFixed(2)}`;
        if (Math.abs(n) < 0.005) nStr = ''; // n이 거의 0일 때
        let eqEl = document.getElementById('deriv-think-eq');
        if (eqEl) eqEl.innerText = `y = ${m.toFixed(2)}x ${nStr}`;
    }

    /* ========================================================= */
    /* --- 기하적 의미 (Geometric Limit) 렌더링 --- */
    /* ========================================================= */
    function renderGeometric() {
        if (!gCtx) return;
        gCtx.clearRect(0, 0, gWidth, gHeight);

        // 1. 그리드 및 축 (연하게)
        gCtx.strokeStyle = '#a0aec0'; gCtx.lineWidth = 2;
        gCtx.beginPath(); gCtx.moveTo(0, gy(0)); gCtx.lineTo(gWidth, gy(0));
        gCtx.moveTo(gx(0), 0); gCtx.lineTo(gx(0), gHeight);
        gCtx.stroke();

        gCtx.fillStyle = '#718096'; gCtx.font = '14px Outfit';
        gCtx.fillText('O', gx(0) - 15, gy(0) + 15);
        gCtx.fillText('x', gWidth - 15, gy(0) + 15);
        gCtx.fillText('y', gx(0) - 15, 15);

        // 2. 포물선 곡선 그리기
        gCtx.beginPath();
        gCtx.strokeStyle = '#2d3748'; // 짙은 회색 곡선
        gCtx.lineWidth = 3;
        for (let x = -1; x <= 6; x += 0.1) {
            let px = gx(x); let py = gy(gFunc(x));
            if (x === -1) gCtx.moveTo(px, py);
            else gCtx.lineTo(px, py);
        }
        gCtx.stroke();
        gCtx.fillStyle = '#2d3748';
        gCtx.font = 'bold 16px Outfit';
        gCtx.fillText('y = f(x)', gx(4.5), gy(gFunc(4.5)) - 10);

        let Ay = gFunc(gPointA_x);

        // 3. 잔상 (Trace) 그리기 (이전 할선들)
        // 교과서 그림처럼, 현재 Delta X 보다 큰 위치의 고정된 할선들을 연하게 그려줍니다.
        let traces = [3.0, 2.0, 1.0, 0.5];
        traces.forEach(dx => {
            if (dx > gDeltaX + 0.1) {
                let Py = gFunc(gPointA_x + dx);
                let m = (Py - Ay) / dx;
                let n = Ay - m * gPointA_x;
                gCtx.beginPath(); gCtx.strokeStyle = 'rgba(113, 128, 150, 0.25)'; gCtx.lineWidth = 2;
                gCtx.moveTo(gx(gPointA_x - 1.5), gy(m * (gPointA_x - 1.5) + n));
                gCtx.lineTo(gx(gPointA_x + dx + 1), gy(m * (gPointA_x + dx + 1) + n));
                gCtx.stroke();
            }
        });

        // 4. 현재 활성화된 점 P와 할선/접선 그리기
        let Px = gPointA_x + gDeltaX;
        let Py = gFunc(Px);
        let m, lineColor;

        if (gDeltaX < 0.01) {
            // 접선 모드 (Delta X가 0)
            m = 2 * 0.15 * gPointA_x + 0.2; // 미분계수 f'(2)
            lineColor = '#3182ce'; // 파란색
        } else {
            // 할선 모드
            m = (Py - Ay) / gDeltaX;
            lineColor = '#e53e3e'; // 빨간색
        }

        let n = Ay - m * gPointA_x;

        gCtx.beginPath();
        gCtx.strokeStyle = lineColor;
        gCtx.lineWidth = (gDeltaX < 0.01) ? 3 : 2;
        gCtx.moveTo(gx(gPointA_x - 1.5), gy(m * (gPointA_x - 1.5) + n));
        gCtx.lineTo(gx(Px + 2), gy(m * (Px + 2) + n));
        gCtx.stroke();

        // 접선일 경우 l 표시
        if (gDeltaX < 0.01) {
            gCtx.fillStyle = '#3182ce';
            gCtx.font = 'bold 20px Outfit';
            gCtx.fillText('l', gx(Px + 1.8), gy(m * (Px + 1.8) + n) - 10);
        }

        // 5. 보조선 및 직각삼각형 (접선일 땐 안 그림)
        if (gDeltaX >= 0.01) {
            gCtx.beginPath();
            gCtx.setLineDash([5, 5]);
            gCtx.strokeStyle = '#a0aec0'; gCtx.lineWidth = 1;

            // 점선 (x, y축 연결)
            gCtx.moveTo(gx(gPointA_x), gy(Ay)); gCtx.lineTo(gx(gPointA_x), gy(0)); // a 수선의 발
            gCtx.moveTo(gx(gPointA_x), gy(Ay)); gCtx.lineTo(gx(0), gy(Ay)); // f(a) 수선의 발
            gCtx.moveTo(gx(Px), gy(Py)); gCtx.lineTo(gx(Px), gy(0)); // a+dx 수선의 발
            gCtx.moveTo(gx(Px), gy(Py)); gCtx.lineTo(gx(0), gy(Py)); // f(a+dx) 수선의 발

            // 직각삼각형 밑변, 높이
            gCtx.moveTo(gx(gPointA_x), gy(Ay)); gCtx.lineTo(gx(Px), gy(Ay));
            gCtx.lineTo(gx(Px), gy(Py));
            gCtx.stroke(); gCtx.setLineDash([]);

            // 직각 기호
            gCtx.strokeRect(gx(Px) - 8, gy(Ay), 8, -8);

            // 라벨 (Delta x, Delta y)
            gCtx.fillStyle = '#ed8936'; gCtx.font = 'bold 15px Outfit'; gCtx.textAlign = 'center';
            gCtx.fillText('Δx', gx(gPointA_x + gDeltaX / 2), gy(Ay) + 20);

            gCtx.textAlign = 'left';
            gCtx.fillText('Δy', gx(Px) + 8, gy((Ay + Py) / 2));
        } else {
            // 접선 모드일 때 보조선 간단히
            gCtx.beginPath(); gCtx.setLineDash([5, 5]); gCtx.strokeStyle = '#a0aec0'; gCtx.lineWidth = 1;
            gCtx.moveTo(gx(gPointA_x), gy(Ay)); gCtx.lineTo(gx(gPointA_x), gy(0));
            gCtx.moveTo(gx(gPointA_x), gy(Ay)); gCtx.lineTo(gx(0), gy(Ay));
            gCtx.stroke(); gCtx.setLineDash([]);
        }

        // 축 라벨 텍스트
        gCtx.fillStyle = '#4a5568'; gCtx.textAlign = 'center'; gCtx.font = '15px Outfit';
        gCtx.fillText('a', gx(gPointA_x), gy(0) + 20);

        gCtx.textAlign = 'right';
        gCtx.fillText('f(a)', gx(0) - 5, gy(Ay) + 5);

        if (gDeltaX >= 0.01) {
            gCtx.textAlign = 'center';
            gCtx.fillText('a+Δx', gx(Px), gy(0) + 20);
            gCtx.textAlign = 'right';
            gCtx.fillText('f(a+Δx)', gx(0) - 5, gy(Py) + 5);
        }
        gCtx.textAlign = 'left'; // reset

        // 6. 점 A, P 그리기
        gCtx.beginPath(); gCtx.arc(gx(gPointA_x), gy(Ay), 6, 0, 2 * Math.PI);
        gCtx.fillStyle = '#553c9a'; gCtx.fill(); gCtx.strokeStyle = '#fff'; gCtx.lineWidth = 2; gCtx.stroke();

        gCtx.fillStyle = '#2d3748'; gCtx.textAlign = 'right'; gCtx.font = 'bold 16px Outfit';
        gCtx.fillText('A', gx(gPointA_x) - 10, gy(Ay) - 10);

        if (gDeltaX >= 0.01) {
            gCtx.beginPath(); gCtx.arc(gx(Px), gy(Py), 6, 0, 2 * Math.PI);
            gCtx.fillStyle = '#e53e3e'; gCtx.fill(); gCtx.stroke();
            gCtx.fillStyle = '#2d3748'; gCtx.textAlign = 'left';
            gCtx.fillText('P', gx(Px) + 10, gy(Py) - 10);
        }

        // 7. UI 업데이트
        let dxValEl = document.getElementById('deriv-geom-dx-val');
        if (dxValEl) dxValEl.innerText = gDeltaX.toFixed(3);
    }

    /* ========================================================= */
    /* --- 초기화 및 이벤트 리스너 설정 --- */
    /* ========================================================= */
    let _initialized = false;

    window.initDeriv = function () {
        tCanvas = document.getElementById('derivThinkCanvas');
        gCanvas = document.getElementById('derivGeomCanvas');

        if (tCanvas && gCanvas) {
            tCtx = tCanvas.getContext('2d');
            tWidth = tCanvas.width;
            tHeight = tCanvas.height;

            gCtx = gCanvas.getContext('2d');
            gWidth = gCanvas.width;
            gHeight = gCanvas.height;

            if (!_initialized) {
                _initialized = true;

                // 슬라이더 이벤트 1 (생각 열기)
                const tSlider = document.getElementById('deriv-think-slider');
                if (tSlider) {
                    tSlider.addEventListener('input', (e) => {
                        tPointP_x = parseFloat(e.target.value);
                        renderThinkOpen();
                    });
                }

                // 슬라이더 이벤트 2 (기하적 의미)
                const gSlider = document.getElementById('deriv-geom-slider');
                if (gSlider) {
                    gSlider.addEventListener('input', (e) => {
                        let v = parseFloat(e.target.value);
                        gDeltaX = v * 3.5;
                        renderGeometric();
                    });
                    gDeltaX = parseFloat(gSlider.value) * 3.5;
                }

                // 평균변화율 수식 KaTeX 렌더링
                const avgFormulaEl = document.getElementById('deriv-avg-formula');
                if (avgFormulaEl && window.katex) {
                    katex.render('\\dfrac{\\Delta y}{\\Delta x}=\\dfrac{f(a+\\Delta x)-f(a)}{\\Delta x}', avgFormulaEl, { throwOnError: false, displayMode: true });
                }
            }

            // 재방문 시에도 항상 다시 그리기
            renderThinkOpen();
            renderGeometric();
        }
    };

    window.derivSwitchPanel = function (tabName) {
        // 단원이 분리되지 않고 하나에 통합되어 있으므로 패널 숨김처리는 불필요함.
    };

})();
