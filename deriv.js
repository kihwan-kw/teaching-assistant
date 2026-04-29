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

    /* ========================================================= */
    /* --- 탭 전환 --- */
    /* ========================================================= */
    window.derivSwitchPanel = function (tabName) {
        ['geometric', 'graph', 'monotone'].forEach(name => {
            const panel = document.getElementById('deriv-panel-' + name);
            if (panel) panel.style.display = (name === tabName) ? '' : 'none';
        });
        document.querySelectorAll('.deriv-tab-btn').forEach(btn => {
            const active = btn.dataset.derivtab === tabName;
            const styles = {
                geometric: { bg: 'linear-gradient(135deg,#63b3ed,#3182ce)', color: '#fff', border: 'none', shadow: '0 4px 12px rgba(49,130,206,0.35)' },
                graph:     { bg: 'linear-gradient(135deg,#68d391,#38a169)', color: '#fff', border: 'none', shadow: '0 4px 12px rgba(56,161,105,0.35)' },
                monotone:  { bg: 'linear-gradient(135deg,#fbd38d,#ed8936)', color: '#fff', border: 'none', shadow: '0 4px 12px rgba(237,137,54,0.35)' },
            };
            const key = btn.dataset.derivtab;
            if (active) {
                btn.style.background = styles[key].bg;
                btn.style.color = styles[key].color;
                btn.style.border = styles[key].border;
                btn.style.boxShadow = styles[key].shadow;
            } else {
                const colors = { geometric: '#2b6cb0', graph: '#276749', monotone: '#c05621' };
                const borders = { geometric: '#63b3ed', graph: '#68d391', monotone: '#f6ad55' };
                btn.style.background = 'rgba(255,255,255,0.7)';
                btn.style.color = colors[key];
                btn.style.border = `2px solid ${borders[key]}`;
                btn.style.boxShadow = 'none';
            }
        });
        if (tabName === 'graph') renderDerivGraph();
        if (tabName === 'monotone') renderDerivMono(currentMonoFn);
    };

    /* ========================================================= */
    /* --- ② 도함수 그래프 --- */
    /* ========================================================= */
    let derivGraphExpr = 'x^3 - 3*x';
    let derivGraphX = 0;
    let dgVP = { xMin: -4, xMax: 4 };   // 도함수 그래프 뷰포트
    let monoVP = { xMin: -4, xMax: 4 }; // 증감 뷰포트

    function numericalDeriv(fn, x, h = 1e-5) {
        return (fn(x + h) - fn(x - h)) / (2 * h);
    }

    function parseExpr(exprStr) {
        try {
            const compiled = math.compile(exprStr);
            return (x) => compiled.evaluate({ x });
        } catch (e) { return null; }
    }

    function drawFuncCanvas(canvas, fn, dfn, xMin, xMax, showTangent, xCur, color, dfColor) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const xRange = xMax - xMin;
        const px = (x) => (x - xMin) / xRange * W;

        // y 범위 자동 계산
        let yVals = [];
        for (let i = 0; i <= 200; i++) {
            const x = xMin + i / 200 * xRange;
            const v = fn(x);
            if (isFinite(v)) yVals.push(v);
        }
        const yPad = 0.15;
        let yMin = Math.min(...yVals), yMax = Math.max(...yVals);
        const ySpan = yMax - yMin || 2;
        yMin -= ySpan * yPad; yMax += ySpan * yPad;
        const py = (y) => H - (y - yMin) / (yMax - yMin) * H;

        // 그리드 + 축
        ctx.strokeStyle = '#f0f4f8'; ctx.lineWidth = 1;
        // x=0 축
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, py(0)); ctx.lineTo(W, py(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(0), 0); ctx.lineTo(px(0), H); ctx.stroke();

        // x축 눈금
        ctx.fillStyle = '#a0aec0'; ctx.font = '11px Outfit'; ctx.textAlign = 'center';
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
            if (x === 0) continue;
            ctx.beginPath(); ctx.moveTo(px(x), py(0) - 4); ctx.lineTo(px(x), py(0) + 4); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.stroke();
            ctx.fillText(x, px(x), py(0) + 15);
        }
        ctx.textAlign = 'left';

        // f(x) 또는 f'(x) 곡선
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 3;
        let started = false;
        for (let i = 0; i <= 400; i++) {
            const x = xMin + i / 400 * xRange;
            const y = fn(x);
            if (!isFinite(y) || y < yMin - ySpan * 2 || y > yMax + ySpan * 2) { started = false; continue; }
            if (!started) { ctx.moveTo(px(x), py(y)); started = true; } else { ctx.lineTo(px(x), py(y)); }
        }
        ctx.stroke();

        // f'(x)=0 점 표시 (극값 후보)
        if (dfn) {
            for (let i = 1; i <= 399; i++) {
                const x1 = xMin + (i - 1) / 400 * xRange;
                const x2 = xMin + i / 400 * xRange;
                const d1 = dfn(x1), d2 = dfn(x2);
                if (d1 * d2 <= 0 && isFinite(d1) && isFinite(d2)) {
                    const xz = (x1 + x2) / 2;
                    ctx.beginPath(); ctx.arc(px(xz), py(fn(xz)), 6, 0, 2 * Math.PI);
                    ctx.fillStyle = '#38a169'; ctx.fill();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                }
            }
        }

        // 현재 x 접선 표시
        if (showTangent && dfn) {
            const slope = dfn(xCur);
            const yCur = fn(xCur);
            const x1 = xCur - 1.5, x2 = xCur + 1.5;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(128,90,213,0.7)'; ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.moveTo(px(x1), py(yCur + slope * (x1 - xCur)));
            ctx.lineTo(px(x2), py(yCur + slope * (x2 - xCur)));
            ctx.stroke(); ctx.setLineDash([]);
            ctx.beginPath(); ctx.arc(px(xCur), py(yCur), 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#805ad5'; ctx.fill();
        }

        // x = xCur 수직선 (f'(x) 캔버스용)
        if (!showTangent) {
            const yCur = fn(xCur);
            if (isFinite(yCur)) {
                ctx.beginPath(); ctx.strokeStyle = 'rgba(128,90,213,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
                ctx.moveTo(px(xCur), 0); ctx.lineTo(px(xCur), H); ctx.stroke(); ctx.setLineDash([]);
                ctx.beginPath(); ctx.arc(px(xCur), py(yCur), 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#805ad5'; ctx.fill();
            }
        }
    }

    function renderDerivGraph() {
        const fxCanvas = document.getElementById('derivFxCanvas');
        const dfxCanvas = document.getElementById('derivDfxCanvas');
        if (!fxCanvas || !dfxCanvas) return;

        const fn = parseExpr(derivGraphExpr);
        if (!fn) return;
        const dfn = (x) => numericalDeriv(fn, x);

        drawFuncCanvas(fxCanvas, fn, dfn, dgVP.xMin, dgVP.xMax, true, derivGraphX, '#3182ce', '#e53e3e');
        drawFuncCanvas(dfxCanvas, dfn, null, dgVP.xMin, dgVP.xMax, false, derivGraphX, '#e53e3e', null);

        const slope = dfn(derivGraphX);
        const slopeEl = document.getElementById('deriv-slope-val');
        const slopeXEl = document.getElementById('deriv-slope-x');
        const xValEl = document.getElementById('deriv-graph-x-val');
        if (slopeEl) slopeEl.textContent = slope.toFixed(3);
        if (slopeXEl) slopeXEl.textContent = derivGraphX.toFixed(2);
        if (xValEl) xValEl.textContent = derivGraphX.toFixed(2);
    }

    /* ========================================================= */
    /* --- ③ 증감·극값 --- */
    /* ========================================================= */
    let currentMonoFn = 'x^3 - 3*x';

    function buildMonoTable(fn, dfn, xMin, xMax) {
        // 임계점 (f'=0) 탐색
        const criticals = [];
        const steps = 1000;
        for (let i = 0; i < steps; i++) {
            const x1 = xMin + i / steps * (xMax - xMin);
            const x2 = xMin + (i + 1) / steps * (xMax - xMin);
            const d1 = dfn(x1), d2 = dfn(x2);
            if (d1 * d2 <= 0 && isFinite(d1) && isFinite(d2)) {
                const xc = (x1 + x2) / 2;
                criticals.push(parseFloat(xc.toFixed(3)));
            }
        }

        if (criticals.length === 0) return '<div style="color:#718096;font-size:13px;">임계점이 없습니다.</div>';

        const pts = [xMin, ...criticals, xMax];
        let html = '<table style="border-collapse:collapse; width:100%; font-size:13px;">';
        html += '<tr style="background:#edf2f7;">';
        html += '<td style="padding:6px 8px; font-weight:700; border:1px solid #e2e8f0;">x</td>';
        pts.forEach((x, i) => {
            const label = (i === 0 || i === pts.length - 1) ? `…` : x.toFixed(2);
            html += `<td style="padding:6px 8px; text-align:center; border:1px solid #e2e8f0; ${(i > 0 && i < pts.length - 1) ? 'font-weight:800;color:#805ad5;' : ''}">${label}</td>`;
        });
        html += '</tr>';

        // f'(x) 부호 행
        html += '<tr>';
        html += '<td style="padding:6px 8px; font-weight:700; border:1px solid #e2e8f0;">f′(x)</td>';
        pts.forEach((x, i) => {
            if (i === 0) { html += `<td style="border:1px solid #e2e8f0;"></td>`; return; }
            const midX = (pts[i - 1] + x) / 2;
            const d = dfn(midX);
            const symbol = Math.abs(d) < 0.01 ? '0' : d > 0 ? '<span style="color:#38a169;font-weight:900;">+</span>' : '<span style="color:#e53e3e;font-weight:900;">−</span>';
            html += `<td style="text-align:center; padding:6px 4px; border:1px solid #e2e8f0;">${symbol}</td>`;
            if (i < pts.length - 1) {
                const dc = dfn(x);
                const sc = Math.abs(dc) < 0.05 ? '<b style="color:#553c9a;">0</b>' : '';
                html += `<td style="text-align:center; padding:6px 4px; border:1px solid #e2e8f0;">${sc}</td>`;
            }
        });
        html += '</tr>';

        // f(x) 증감 행
        html += '<tr>';
        html += '<td style="padding:6px 8px; font-weight:700; border:1px solid #e2e8f0;">f(x)</td>';
        pts.forEach((x, i) => {
            if (i === 0) { html += `<td style="border:1px solid #e2e8f0;"></td>`; return; }
            const midX = (pts[i - 1] + x) / 2;
            const d = dfn(midX);
            const arr = Math.abs(d) < 0.01 ? '' : d > 0 ? '<span style="color:#38a169;font-size:18px;">↗</span>' : '<span style="color:#e53e3e;font-size:18px;">↘</span>';
            html += `<td style="text-align:center; padding:4px; border:1px solid #e2e8f0;">${arr}</td>`;
            if (i < pts.length - 1) {
                const fc = fn(x).toFixed(2);
                const dc = dfn(x);
                const isMax = dc < 0 ? false : (i > 0 && dfn(pts[i - 1]) > 0 && dc < 0) ? true : false;
                const dPrev = i > 0 ? dfn((pts[i - 1] + x) / 2) : 0;
                const dNext = dfn((x + pts[i + 1 < pts.length ? i + 1 : i]) / 2);
                let label = `<b>${fc}</b>`;
                if (dPrev > 0 && dNext < 0) label = `<span style="color:#e53e3e;font-weight:900;">극대 ${fc}</span>`;
                else if (dPrev < 0 && dNext > 0) label = `<span style="color:#3182ce;font-weight:900;">극소 ${fc}</span>`;
                html += `<td style="text-align:center; padding:4px 6px; border:1px solid #e2e8f0; font-size:12px;">${label}</td>`;
            }
        });
        html += '</tr></table>';
        return html;
    }

    function renderDerivMono(exprStr) {
        currentMonoFn = exprStr;
        const fxCanvas = document.getElementById('derivMonoFxCanvas');
        const dfxCanvas = document.getElementById('derivMonoDfxCanvas');
        const tableEl = document.getElementById('deriv-mono-table');
        if (!fxCanvas || !dfxCanvas) return;

        const fn = parseExpr(exprStr);
        if (!fn) return;
        const dfn = (x) => numericalDeriv(fn, x);

        drawFuncCanvas(fxCanvas, fn, dfn, -4, 4, false, 0, '#3182ce', null);
        drawFuncCanvas(dfxCanvas, dfn, null, -4, 4, false, 0, '#e53e3e', null);

        // f(x) 캔버스에 증가/감소 구간 색칠
        const fxCtx = fxCanvas.getContext('2d');
        const W = fxCanvas.width, H = fxCanvas.height;
        const xMin = -4, xMax = 4;
        let yVals = [];
        for (let i = 0; i <= 200; i++) { const v = fn(xMin + i / 200 * 8); if (isFinite(v)) yVals.push(v); }
        const yPad = 0.15;
        let yMin = Math.min(...yVals), yMax = Math.max(...yVals);
        const ySpan = yMax - yMin || 2;
        yMin -= ySpan * yPad; yMax += ySpan * yPad;
        const PX = (x) => (x - xMin) / 8 * W;
        const PY = (y) => H - (y - yMin) / (yMax - yMin) * H;
        const steps = 400;
        for (let i = 0; i < steps; i++) {
            const x1 = xMin + i / steps * 8, x2 = xMin + (i + 1) / steps * 8;
            const d = dfn((x1 + x2) / 2);
            if (!isFinite(d)) continue;
            const y0 = PY(0), y1 = PY(fn(x1)), y2 = PY(fn(x2));
            fxCtx.beginPath();
            fxCtx.moveTo(PX(x1), y0); fxCtx.lineTo(PX(x1), y1);
            fxCtx.lineTo(PX(x2), y2); fxCtx.lineTo(PX(x2), y0);
            fxCtx.closePath();
            fxCtx.fillStyle = d > 0 ? 'rgba(56,161,105,0.08)' : 'rgba(229,62,62,0.08)';
            fxCtx.fill();
        }

        // f'(x)=0 수직 점선 표시 (f'(x) 캔버스)
        const dfxCtx = dfxCanvas.getContext('2d');
        const DW = dfxCanvas.width, DH = dfxCanvas.height;
        let dfVals = [];
        for (let i = 0; i <= 200; i++) { const v = dfn(xMin + i / 200 * 8); if (isFinite(v)) dfVals.push(v); }
        let dyMin = Math.min(...dfVals), dyMax = Math.max(...dfVals);
        const dySpan = dyMax - dyMin || 2;
        dyMin -= dySpan * yPad; dyMax += dySpan * yPad;
        const DPX = (x) => (x - xMin) / 8 * DW;
        const DPY = (y) => DH - (y - dyMin) / (dyMax - dyMin) * DH;

        for (let i = 1; i <= 399; i++) {
            const x1 = xMin + (i - 1) / 400 * 8, x2 = xMin + i / 400 * 8;
            const d1 = dfn(x1), d2 = dfn(x2);
            if (d1 * d2 <= 0 && isFinite(d1) && isFinite(d2)) {
                const xz = (x1 + x2) / 2;
                dfxCtx.beginPath(); dfxCtx.setLineDash([5, 4]);
                dfxCtx.strokeStyle = 'rgba(128,90,213,0.5)'; dfxCtx.lineWidth = 1.5;
                dfxCtx.moveTo(DPX(xz), 0); dfxCtx.lineTo(DPX(xz), DH); dfxCtx.stroke();
                dfxCtx.setLineDash([]);
                dfxCtx.fillStyle = '#553c9a'; dfxCtx.font = 'bold 11px Outfit'; dfxCtx.textAlign = 'center';
                dfxCtx.fillText(`x=${xz.toFixed(2)}`, DPX(xz), 14);
            }
        }

        if (tableEl) tableEl.innerHTML = buildMonoTable(fn, dfn, monoVP.xMin, monoVP.xMax);
    }

    /* ========================================================= */
    /* --- initDeriv에 새 탭 이벤트 등록 --- */
    /* ========================================================= */
    const _origInit = window.initDeriv;
    window.initDeriv = function () {
        _origInit();

        if (!_initialized2) {
            _initialized2 = true;

            // 탭 버튼 클릭
            document.querySelectorAll('.deriv-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    window.derivSwitchPanel(btn.dataset.derivtab);
                });
            });

            // 도함수 그래프 그리기 버튼
            const drawBtn = document.getElementById('deriv-graph-draw-btn');
            if (drawBtn) {
                drawBtn.addEventListener('click', () => {
                    const inp = document.getElementById('deriv-graph-input');
                    const errEl = document.getElementById('deriv-graph-error');
                    const fn = parseExpr(inp.value);
                    if (!fn) { errEl.textContent = '수식 오류: 올바른 형식으로 입력하세요.'; return; }
                    errEl.textContent = '';
                    derivGraphExpr = inp.value;
                    renderDerivGraph();
                });
            }

            // x 슬라이더
            const xSlider = document.getElementById('deriv-graph-x-slider');
            if (xSlider) {
                xSlider.addEventListener('input', (e) => {
                    derivGraphX = parseFloat(e.target.value);
                    renderDerivGraph();
                });
            }

            // 증감 preset 버튼
            document.querySelectorAll('.deriv-mono-preset').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.deriv-mono-preset').forEach(b => {
                        b.style.background = 'rgba(255,255,255,0.8)';
                        b.style.borderColor = '#cbd5e0';
                        b.style.color = '#4a5568';
                    });
                    btn.style.background = 'linear-gradient(135deg,#fbd38d,#f6ad55)';
                    btn.style.borderColor = '#ed8936';
                    btn.style.color = '#7b341e';
                    renderDerivMono(btn.dataset.fn);
                });
            });

            // 팬/줌 이벤트 연결 (② 도함수 그래프)
            const fxC = document.getElementById('derivFxCanvas');
            const dfxC = document.getElementById('derivDfxCanvas');
            if (fxC) attachPanZoom(fxC, dgVP, renderDerivGraph);
            if (dfxC) attachPanZoom(dfxC, dgVP, renderDerivGraph);

            // 팬/줌 이벤트 연결 (③ 증감·극값)
            const mfxC = document.getElementById('derivMonoFxCanvas');
            const mdfxC = document.getElementById('derivMonoDfxCanvas');
            if (mfxC) attachPanZoom(mfxC, monoVP, () => renderDerivMono(currentMonoFn));
            if (mdfxC) attachPanZoom(mdfxC, monoVP, () => renderDerivMono(currentMonoFn));
        }
    };

    /* ========================================================= */
    /* --- 팬/줌 헬퍼 --- */
    /* ========================================================= */
    function attachPanZoom(canvas, vpRef, onRender) {
        // cursor 스타일
        canvas.style.cursor = 'grab';

        // 휠: 마우스 위치 기준 줌
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseRatio = (e.clientX - rect.left) / rect.width;
            const xSpan = vpRef.xMax - vpRef.xMin;
            const factor = e.deltaY > 0 ? 1.12 : 0.89; // 확대/축소
            const newSpan = Math.min(Math.max(xSpan * factor, 0.5), 80);
            const centerX = vpRef.xMin + mouseRatio * xSpan;
            vpRef.xMin = centerX - mouseRatio * newSpan;
            vpRef.xMax = centerX + (1 - mouseRatio) * newSpan;
            onRender();
        }, { passive: false });

        // 드래그 팬
        let dragging = false;
        let dragStartX = 0;
        let dragStartVP = null;

        canvas.addEventListener('mousedown', (e) => {
            dragging = true;
            dragStartX = e.clientX;
            dragStartVP = { xMin: vpRef.xMin, xMax: vpRef.xMax };
            canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const rect = canvas.getBoundingClientRect();
            const dx = (e.clientX - dragStartX) / rect.width;
            const xSpan = dragStartVP.xMax - dragStartVP.xMin;
            vpRef.xMin = dragStartVP.xMin - dx * xSpan;
            vpRef.xMax = dragStartVP.xMax - dx * xSpan;
            onRender();
        });

        window.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            canvas.style.cursor = 'grab';
        });

        // 터치 팬 (태블릿)
        let touchStartX = 0;
        let touchStartVP = null;
        canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartVP = { xMin: vpRef.xMin, xMax: vpRef.xMax };
        }, { passive: true });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const dx = (e.touches[0].clientX - touchStartX) / rect.width;
            const xSpan = touchStartVP.xMax - touchStartVP.xMin;
            vpRef.xMin = touchStartVP.xMin - dx * xSpan;
            vpRef.xMax = touchStartVP.xMax - dx * xSpan;
            onRender();
        }, { passive: false });
    }

    let _initialized2 = false;

})();
