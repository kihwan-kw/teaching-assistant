/* ========================================================= */
/* --- Quadratic Function Max/Min (이차함수 최대/최소) Logic --- */
/* ========================================================= */

let isQuadInit = false;

function initQuad() {
    if (isQuadInit) return;
    isQuadInit = true;

    const qCanvas = document.getElementById('quadCanvas');
    if (!qCanvas) return;
    const qCtx = qCanvas.getContext('2d');

    const funcInput = document.getElementById('quad-func-input');
    const drawBtn = document.getElementById('quad-draw-btn');
    const errorMsg = document.getElementById('quad-error');

    const aSlider = document.getElementById('quad-a-slider');
    const bSlider = document.getElementById('quad-b-slider');
    const aInput = document.getElementById('quad-a-input');
    const bInput = document.getElementById('quad-b-input');
    const analysisBox = document.getElementById('quad-analysis');

    let quadExpr = null;
    let rangeA = -1;
    let rangeB = 4;

    // Zoom & Pan 제어 변수
    let zoom = 40; // 1 unit = 40px
    let offsetX = qCanvas.width / 2;
    let offsetY = qCanvas.height / 2 + 100; // 포물선이 잘 보이게 y축을 살짝 내림
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

    /* --- 마우스 줌/패닝 이벤트 --- */
    qCanvas.addEventListener('mousedown', e => { isDragging = true; lastMouse = { x: e.offsetX, y: e.offsetY }; qCanvas.style.cursor = 'grabbing'; });
    qCanvas.addEventListener('mousemove', e => {
        if (!isDragging) return;
        offsetX += e.offsetX - lastMouse.x;
        offsetY += e.offsetY - lastMouse.y;
        lastMouse = { x: e.offsetX, y: e.offsetY };
        renderQuadGraph();
    });
    window.addEventListener('mouseup', () => { isDragging = false; if (qCanvas) qCanvas.style.cursor = 'grab'; });
    qCanvas.addEventListener('wheel', e => {
        e.preventDefault();
        const oldZoom = zoom;
        zoom *= e.deltaY < 0 ? 1.1 : 0.9;
        zoom = Math.max(10, Math.min(zoom, 300));
        offsetX = e.offsetX - (e.offsetX - offsetX) * (zoom / oldZoom);
        offsetY = e.offsetY - (e.offsetY - offsetY) * (zoom / oldZoom);
        renderQuadGraph();
    }, { passive: false });

    /* --- 🌟 슬라이더 & 직접 입력 동기화 로직 🌟 --- */
    function updateRange(source) {
        let valA, valB;

        // 슬라이더를 움직였을 때 -> 입력칸(Input) 값 업데이트
        if (source === 'slider') {
            valA = parseFloat(aSlider.value);
            valB = parseFloat(bSlider.value);

            if (valA >= valB) { valA = valB - 0.1; aSlider.value = valA; }

            aInput.value = valA.toFixed(1);
            bInput.value = valB.toFixed(1);
        }
        // 숫자를 직접 입력했을 때 -> 슬라이더 위치 업데이트
        else if (source === 'input') {
            valA = parseFloat(aInput.value);
            valB = parseFloat(bInput.value);

            if (isNaN(valA)) valA = rangeA;
            if (isNaN(valB)) valB = rangeB;
            if (valA >= valB) { valA = valB - 0.1; aInput.value = valA.toFixed(1); }

            // 입력값이 슬라이더의 범위를 벗어나면 슬라이더의 최소/최대 범위 자체를 넓혀줍니다.
            if (valA < aSlider.min) aSlider.min = Math.floor(valA - 5);
            if (valB > bSlider.max) bSlider.max = Math.ceil(valB + 5);

            aSlider.value = valA;
            bSlider.value = valB;
        }

        rangeA = valA;
        rangeB = valB;
        renderQuadGraph();
    }

    // 슬라이더를 움직일 때 이벤트 연결
    aSlider.addEventListener('input', () => updateRange('slider'));
    bSlider.addEventListener('input', () => updateRange('slider'));

    // 숫자를 직접 입력하고 엔터를 치거나 포커스를 벗어날 때 이벤트 연결
    aInput.addEventListener('change', () => updateRange('input'));
    bInput.addEventListener('change', () => updateRange('input'));

    // (엔터키 쳤을 때 즉시 반영)
    aInput.addEventListener('keypress', e => { if (e.key === 'Enter') { updateRange('input'); aInput.blur(); } });
    bInput.addEventListener('keypress', e => { if (e.key === 'Enter') { updateRange('input'); bInput.blur(); } });

    function parseAndDraw() {
        const exprStr = funcInput.value.trim();
        try {
            quadExpr = math.parse(exprStr);
            quadExpr.evaluate({ x: 0 }); // 문법 테스트
            errorMsg.innerText = "";
            renderQuadGraph();
        } catch (e) {
            errorMsg.innerText = "올바른 수식을 입력하세요.";
        }
    }

    drawBtn.addEventListener('click', parseAndDraw);
    funcInput.addEventListener('keypress', e => { if (e.key === 'Enter') parseAndDraw(); });

    /* --- 그리드 및 축 그리기 --- */
    function drawGrid() {
        qCtx.clearRect(0, 0, qCanvas.width, qCanvas.height);
        qCtx.lineWidth = 1; qCtx.strokeStyle = 'rgba(0, 0, 0, 0.08)';

        let startCol = Math.floor(-offsetX / zoom);
        let endCol = Math.ceil((qCanvas.width - offsetX) / zoom);
        for (let i = startCol; i <= endCol; i++) {
            let px = offsetX + i * zoom;
            qCtx.beginPath(); qCtx.moveTo(px, 0); qCtx.lineTo(px, qCanvas.height); qCtx.stroke();
        }
        let startRow = Math.floor((offsetY - qCanvas.height) / zoom);
        let endRow = Math.ceil(offsetY / zoom);
        for (let i = startRow; i <= endRow; i++) {
            let py = offsetY - i * zoom;
            qCtx.beginPath(); qCtx.moveTo(0, py); qCtx.lineTo(qCanvas.width, py); qCtx.stroke();
        }

        // 메인 축 (X, Y)
        qCtx.lineWidth = 2; qCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        qCtx.beginPath(); qCtx.moveTo(0, offsetY); qCtx.lineTo(qCanvas.width, offsetY); qCtx.stroke();
        qCtx.beginPath(); qCtx.moveTo(offsetX, 0); qCtx.lineTo(offsetX, qCanvas.height); qCtx.stroke();

        qCtx.fillStyle = '#718096'; qCtx.font = '12px Outfit, sans-serif';
        let stepSize = zoom < 20 ? 5 : (zoom < 40 ? 2 : 1);
        for (let i = startCol; i <= endCol; i++) {
            if (i !== 0 && i % stepSize === 0) qCtx.fillText(i, offsetX + i * zoom - 5, offsetY + 16);
        }
        for (let i = startRow; i <= endRow; i++) {
            if (i !== 0 && i % stepSize === 0) qCtx.fillText(i, offsetX + 8, offsetY - i * zoom + 4);
        }
        qCtx.fillText('O', offsetX - 12, offsetY + 15);
    }

    /* --- 메인 렌더링 함수 --- */
    function renderQuadGraph() {
        drawGrid();
        if (!quadExpr) return;

        const startX = (-offsetX / zoom) - 1;
        const endX = ((qCanvas.width - offsetX) / zoom) + 1;
        const step = (endX - startX) / 800; // 촘촘하게

        qCtx.lineWidth = 3;

        // 1. 전체 그래프 그리기 (점선/실선 분기 처리)
        let prevPx = null, prevPy = null;

        for (let t = startX; t <= endX; t += step) {
            try {
                let y = quadExpr.evaluate({ x: t });
                if (isNaN(y) || !isFinite(y)) continue;

                let px = offsetX + t * zoom;
                let py = offsetY - y * zoom;

                let isInside = (t >= rangeA && t <= rangeB);

                if (prevPx !== null) {
                    qCtx.beginPath();
                    qCtx.moveTo(prevPx, prevPy);
                    qCtx.lineTo(px, py);

                    // 스타일 동적 변경
                    if (isInside) {
                        qCtx.strokeStyle = '#4fd1c5'; // 진한 청록색 (실선)
                        qCtx.globalAlpha = 1.0;
                        qCtx.setLineDash([]);
                        qCtx.lineWidth = 4;
                    } else {
                        qCtx.strokeStyle = '#a0aec0'; // 흐릿한 회색 (점선)
                        qCtx.globalAlpha = 0.5;
                        qCtx.setLineDash([5, 5]);
                        qCtx.lineWidth = 2;
                    }
                    qCtx.stroke();
                }

                prevPx = px; prevPy = py;
            } catch (e) { }
        }
        qCtx.setLineDash([]); // 설정 초기화
        qCtx.globalAlpha = 1.0;

        // 2. 구간 [a, b]의 경계선 (수직 점선) 그리기
        let pxA = offsetX + rangeA * zoom;
        let pxB = offsetX + rangeB * zoom;

        qCtx.beginPath();
        qCtx.moveTo(pxA, 0); qCtx.lineTo(pxA, qCanvas.height);
        qCtx.strokeStyle = 'rgba(115, 165, 255, 0.3)'; // a 경계선 (파랑)
        qCtx.lineWidth = 2; qCtx.setLineDash([8, 4]); qCtx.stroke();

        qCtx.beginPath();
        qCtx.moveTo(pxB, 0); qCtx.lineTo(pxB, qCanvas.height);
        qCtx.strokeStyle = 'rgba(255, 139, 173, 0.3)'; // b 경계선 (빨강)
        qCtx.stroke();
        qCtx.setLineDash([]);

        // 3. 최댓값 / 최솟값 분석 및 마킹 (해석적 방식 적용)
        let criticalX = [rangeA, rangeB];
        try {
            let d1 = math.derivative(quadExpr, 'x');
            let d2 = math.derivative(d1, 'x');
            let d2_0 = d2.evaluate({x: 0});
            let d2_1 = d2.evaluate({x: 1});
            
            // 이차함수 여부 검증 (이계도함수가 상수인지 확인)
            if (Math.abs(d2_0 - d2_1) < 1e-8) {
                let c = d2_0; // 2a
                if (Math.abs(c) > 1e-10) {
                    let b = d1.evaluate({x: 0});
                    let x_v = -b / c; // 꼭짓점 x
                    // 꼭짓점이 구간 내에 있으면 후보에 추가
                    if (x_v >= rangeA && x_v <= rangeB) {
                        criticalX.push(x_v);
                    }
                }
            }
        } catch(e) {}

        // 임의의 비-이차함수에 대해서도 대체로 올바른 값을 구하기 위해 샘플링 포인트 병합
        let sampleStep = (rangeB - rangeA) / 800;
        if (sampleStep > 0) {
            for (let t = rangeA; t <= rangeB; t += sampleStep) {
                criticalX.push(t);
            }
        }

        let evaluated = [];
        for (let x of criticalX) {
            try {
                let y = quadExpr.evaluate({x: x});
                if (!isNaN(y) && isFinite(y)) evaluated.push({x: x, y: y});
            } catch(e) {}
        }

        function getExtremums(points, isMax) {
            if (points.length === 0) return { val: 0, pts: [] };
            points.sort((a, b) => isMax ? b.y - a.y : a.y - b.y);
            let bestVal = points[0].y;
            // 허용 오차 내의 모든 값을 같은 최고/최저점으로 간주
            let bestPts = points.filter(p => Math.abs(p.y - bestVal) < 1e-7);
            
            // X축이 아주 가까운 점들 제거 (단일 지점으로 클러스터링)
            let clustered = [];
            bestPts.forEach(p => {
                if (!clustered.some(c => Math.abs(c.x - p.x) < 0.05)) {
                    clustered.push(p);
                }
            });
            clustered.sort((a, b) => a.x - b.x);
            return { val: bestVal, pts: clustered };
        }

        if (evaluated.length > 0) {
            let maxData = getExtremums(evaluated, true);
            let minData = getExtremums(evaluated, false);

            maxData.pts.forEach(pt => {
                let px = offsetX + pt.x * zoom;
                let py = offsetY - pt.y * zoom;
                qCtx.beginPath(); qCtx.arc(px, py, 7, 0, Math.PI * 2);
                qCtx.fillStyle = '#e53e3e'; qCtx.fill(); qCtx.strokeStyle = '#fff'; qCtx.lineWidth = 2; qCtx.stroke();
                qCtx.font = 'bold 14px Outfit'; qCtx.fillText(`Max (${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`, px + 10, py - 10);
            });

            minData.pts.forEach(pt => {
                let px = offsetX + pt.x * zoom;
                let py = offsetY - pt.y * zoom;
                qCtx.beginPath(); qCtx.arc(px, py, 7, 0, Math.PI * 2);
                qCtx.fillStyle = '#3182ce'; qCtx.fill(); qCtx.strokeStyle = '#fff'; qCtx.lineWidth = 2; qCtx.stroke();
                qCtx.font = 'bold 14px Outfit'; qCtx.fillText(`Min (${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`, px + 10, py + 20);
            });

            let maxXVals = maxData.pts.map(p => p.x.toFixed(2)).join(', ');
            let minXVals = minData.pts.map(p => p.x.toFixed(2)).join(', ');

            analysisBox.innerHTML = `
                <div style="margin-bottom: 12px; font-size: 15px; color: #4a5568;">구간: [ <strong>${rangeA.toFixed(1)}</strong>, <strong>${rangeB.toFixed(1)}</strong> ]</div>
                
                <div style="margin-bottom: 10px; background: rgba(229, 62, 62, 0.08); padding: 12px 15px; border-radius: 8px; border-left: 4px solid #e53e3e;">
                    <div style="color: #4a5568; font-size: 14px; margin-bottom: 4px;">
                        <strong style="color:#e53e3e; font-size:17px; letter-spacing: 0.5px;">x = ${maxXVals}</strong> 일 때
                    </div>
                    <div style="font-size: 15px;">
                        최댓값 <strong style="color:#e53e3e; font-size:22px; margin-left: 5px;">${maxData.val.toFixed(2)}</strong>
                    </div>
                </div>

                <div style="background: rgba(49, 130, 206, 0.08); padding: 12px 15px; border-radius: 8px; border-left: 4px solid #3182ce;">
                    <div style="color: #4a5568; font-size: 14px; margin-bottom: 4px;">
                        <strong style="color:#3182ce; font-size:17px; letter-spacing: 0.5px;">x = ${minXVals}</strong> 일 때
                    </div>
                    <div style="font-size: 15px;">
                        최솟값 <strong style="color:#3182ce; font-size:22px; margin-left: 5px;">${minData.val.toFixed(2)}</strong>
                    </div>
                </div>
            `;
        }
    }

    // 처음 켰을 때 수식 파싱 후 화면 출력
    parseAndDraw();
}