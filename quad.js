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

        // 최댓값/최솟값 추적 변수
        let maxVal = -Infinity, minVal = Infinity;
        let maxPt = null, minPt = null;

        qCtx.lineWidth = 3;

        // 1. 전체 그래프 그리기 (점선/실선 분기 처리)
        let prevPx = null, prevPy = null, prevInside = false;

        for (let t = startX; t <= endX; t += step) {
            try {
                let y = quadExpr.evaluate({ x: t });
                if (isNaN(y) || !isFinite(y)) continue;

                let px = offsetX + t * zoom;
                let py = offsetY - y * zoom;

                let isInside = (t >= rangeA && t <= rangeB);

                // 구간 내부에서만 최대/최소 추적
                if (isInside) {
                    if (y > maxVal) { maxVal = y; maxPt = { x: t, y: y, px, py }; }
                    if (y < minVal) { minVal = y; minPt = { x: t, y: y, px, py }; }
                }

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

                prevPx = px; prevPy = py; prevInside = isInside;
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

        // 3. 최댓값 / 최솟값 점 마킹 및 피드백 텍스트 업데이트
        if (maxPt && minPt) {
            // 최댓값 점 (빨간색)
            qCtx.beginPath(); qCtx.arc(maxPt.px, maxPt.py, 7, 0, Math.PI * 2);
            qCtx.fillStyle = '#e53e3e'; qCtx.fill(); qCtx.strokeStyle = '#fff'; qCtx.lineWidth = 2; qCtx.stroke();
            qCtx.font = 'bold 14px Outfit'; qCtx.fillText(`Max (${maxPt.x.toFixed(1)}, ${maxPt.y.toFixed(1)})`, maxPt.px + 10, maxPt.py - 10);

            // 최솟값 점 (파란색)
            qCtx.beginPath(); qCtx.arc(minPt.px, minPt.py, 7, 0, Math.PI * 2);
            qCtx.fillStyle = '#3182ce'; qCtx.fill(); qCtx.strokeStyle = '#fff'; qCtx.lineWidth = 2; qCtx.stroke();
            qCtx.font = 'bold 14px Outfit'; qCtx.fillText(`Min (${minPt.x.toFixed(1)}, ${minPt.y.toFixed(1)})`, minPt.px + 10, minPt.py + 20);

            // 좌측 분석 패널 업데이트
            analysisBox.innerHTML = `
                <div style="margin-bottom: 8px;">구간: [ <strong>${rangeA.toFixed(1)}</strong>, <strong>${rangeB.toFixed(1)}</strong> ]</div>
                <div>최댓값: <strong style="color:#e53e3e; font-size:18px;">${maxVal.toFixed(2)}</strong> <span style="font-size:12px; color:#a0aec0;">(x=${maxPt.x.toFixed(2)} 일 때)</span></div>
                <div style="margin-top: 5px;">최솟값: <strong style="color:#3182ce; font-size:18px;">${minVal.toFixed(2)}</strong> <span style="font-size:12px; color:#a0aec0;">(x=${minPt.x.toFixed(2)} 일 때)</span></div>
            `;
        }
    }

    // 처음 켰을 때 수식 파싱 후 화면 출력
    parseAndDraw();
}