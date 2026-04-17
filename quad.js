/* ========================================================= */
/* --- Quadratic Function (이차함수: 평행이동 & 최대/최소) --- */
/* ========================================================= */

window.initQuad = (function () {
    let _initialized = false;

    return function () {
        if (_initialized) return;
        _initialized = true;

        const qCanvas = document.getElementById('quadCanvas');
        if (!qCanvas) return;
        const qCtx = qCanvas.getContext('2d');

        // 상태 변수
        let currentQuadTab = 'shift'; // 'shift' 또는 'maxmin'

        // [평행이동 상태]
        let pVal = 0, qVal = 0;

        // [최대최소 상태]
        let quadExpr = null;
        let rangeA = -1, rangeB = 4;

        // 공통 Zoom & Pan
        let zoom = 40;
        let offsetX = qCanvas.width / 2;
        let offsetY = qCanvas.height / 2 + 50;
        let isPanning = false, lastMouse = { x: 0, y: 0 };

        // 🌟 [드래그(Drag) 객체 상태]
        let isDraggingVertex = false; // 꼭짓점 잡기 (평행이동)
        let isDraggingLineA = false;  // a 경계선 잡기 (최대최소)
        let isDraggingLineB = false;  // b 경계선 잡기 (최대최소)
        const HIT_RADIUS = 15; // 마우스 클릭 판정 반경

        /* ==================== 1. 탭 제어 ==================== */
        window.quadSwitchPanel = function (tabName) {
            currentQuadTab = tabName;
            document.querySelectorAll('.quad-panel').forEach(p => p.style.display = 'none');
            document.getElementById(`quad-panel-${tabName}`).style.display = 'block';

            if (tabName === 'shift') updateShiftFormula();
            if (tabName === 'maxmin') parseAndDrawMaxMin();

            drawQuad();
        };

        /* ==================== 2. 마우스 이벤트 (드래그 & 줌) ==================== */
        function getMousePos(e) {
            const rect = qCanvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }

        qCanvas.addEventListener('mousedown', e => {
            const pos = getMousePos(e);
            const mathX = (pos.x - offsetX) / zoom;
            const mathY = (offsetY - pos.y) / zoom;

            if (currentQuadTab === 'shift') {
                // 평행이동: 꼭짓점(p, q) 반경 안을 클릭했는가?
                let vPx = offsetX + pVal * zoom;
                let vPy = offsetY - qVal * zoom;
                if (Math.hypot(pos.x - vPx, pos.y - vPy) < HIT_RADIUS + 10) {
                    isDraggingVertex = true;
                    qCanvas.style.cursor = 'grabbing';
                    return; // 캔버스 패닝 금지
                }
            } else if (currentQuadTab === 'maxmin') {
                // 최대최소: a 또는 b 수직선을 클릭했는가?
                let aPx = offsetX + rangeA * zoom;
                let bPx = offsetX + rangeB * zoom;
                if (Math.abs(pos.x - aPx) < HIT_RADIUS) { isDraggingLineA = true; qCanvas.style.cursor = 'ew-resize'; return; }
                if (Math.abs(pos.x - bPx) < HIT_RADIUS) { isDraggingLineB = true; qCanvas.style.cursor = 'ew-resize'; return; }
            }

            // 허공 클릭 시 패닝(화면 이동) 시작
            isPanning = true;
            lastMouse = pos;
            qCanvas.style.cursor = 'move';
        });

        qCanvas.addEventListener('mousemove', e => {
            const pos = getMousePos(e);

            // 1. 마우스 호버 (커서 모양 변경)
            if (!isPanning && !isDraggingVertex && !isDraggingLineA && !isDraggingLineB) {
                if (currentQuadTab === 'shift') {
                    let vPx = offsetX + pVal * zoom, vPy = offsetY - qVal * zoom;
                    qCanvas.style.cursor = (Math.hypot(pos.x - vPx, pos.y - vPy) < HIT_RADIUS + 10) ? 'grab' : 'default';
                } else if (currentQuadTab === 'maxmin') {
                    let aPx = offsetX + rangeA * zoom, bPx = offsetX + rangeB * zoom;
                    if (Math.abs(pos.x - aPx) < HIT_RADIUS || Math.abs(pos.x - bPx) < HIT_RADIUS) qCanvas.style.cursor = 'ew-resize';
                    else qCanvas.style.cursor = 'default';
                }
            }

            // 2. 실제 드래그 처리
            if (isDraggingVertex) {
                // 수식을 위해 정수 단위로 딱딱 끊어지게 스냅(Snap) 적용
                pVal = Math.round((pos.x - offsetX) / zoom);
                qVal = Math.round((offsetY - pos.y) / zoom);

                // 슬라이더 동기화
                document.getElementById('quad-p-slider').value = pVal;
                document.getElementById('quad-q-slider').value = qVal;
                document.getElementById('quad-p-val').innerText = pVal;
                document.getElementById('quad-q-val').innerText = qVal;

                updateShiftFormula();
                drawQuad();
            } else if (isDraggingLineA) {
                let mathX = (pos.x - offsetX) / zoom;
                if (mathX >= rangeB) mathX = rangeB - 0.1; // 역전 방지
                rangeA = parseFloat(mathX.toFixed(1));
                syncMaxMinInput('slider');
            } else if (isDraggingLineB) {
                let mathX = (pos.x - offsetX) / zoom;
                if (mathX <= rangeA) mathX = rangeA + 0.1;
                rangeB = parseFloat(mathX.toFixed(1));
                syncMaxMinInput('slider');
            } else if (isPanning) {
                offsetX += pos.x - lastMouse.x;
                offsetY += pos.y - lastMouse.y;
                lastMouse = pos;
                drawQuad();
            }
        });

        window.addEventListener('mouseup', () => {
            isPanning = false; isDraggingVertex = false;
            isDraggingLineA = false; isDraggingLineB = false;
            if (qCanvas) qCanvas.style.cursor = 'default';
        });

        qCanvas.addEventListener('wheel', e => {
            e.preventDefault();
            const oldZoom = zoom;
            zoom *= e.deltaY < 0 ? 1.1 : 0.9;
            zoom = Math.max(10, Math.min(zoom, 150));
            offsetX = e.offsetX - (e.offsetX - offsetX) * (zoom / oldZoom);
            offsetY = e.offsetY - (e.offsetY - offsetY) * (zoom / oldZoom);
            drawQuad();
        }, { passive: false });

        /* ==================== 3. 평행이동 로직 ==================== */
        const pSlider = document.getElementById('quad-p-slider');
        const qSlider = document.getElementById('quad-q-slider');
        const aShiftSlider = document.getElementById('quad-a-shift-slider'); // 🌟 추가
        const pValTxt = document.getElementById('quad-p-val');
        const qValTxt = document.getElementById('quad-q-val');
        const aValTxt = document.getElementById('quad-a-shift-val'); // 🌟 추가

        let aVal = 1; // 🌟 추가: 이차항의 계수

        function updateShiftFromSlider() {
            pVal = parseInt(pSlider.value);
            qVal = parseInt(qSlider.value);
            aVal = parseFloat(aShiftSlider.value);
            if (aVal === 0) { aVal = 0.5; aShiftSlider.value = 0.5; } // a가 0이 되면 이차함수가 아니므로 방지

            pValTxt.innerText = pVal;
            qValTxt.innerText = qVal;
            aValTxt.innerText = aVal;

            updateShiftFormula();
            drawQuad();
        }

        pSlider.addEventListener('input', updateShiftFromSlider);
        qSlider.addEventListener('input', updateShiftFromSlider);
        aShiftSlider.addEventListener('input', updateShiftFromSlider);

        document.getElementById('quad-shift-reset').addEventListener('click', () => {
            pSlider.value = 0; qSlider.value = 0; aShiftSlider.value = 1;
            offsetX = qCanvas.width / 2; offsetY = qCanvas.height / 2 + 50; zoom = 40;
            updateShiftFromSlider();
        });

        function updateShiftFormula() {
            // 🌟 y = a(x - p)^2 + q 수식 렌더링
            let aStr = aVal === 1 ? '' : (aVal === -1 ? '-' : aVal);
            let pStr = pVal === 0 ? 'x' : (pVal > 0 ? `(x - ${pVal})` : `(x + ${Math.abs(pVal)})`);
            let pColorStr = pVal === 0 ? 'x' : `(x <span style="color:#e53e3e;">${pVal > 0 ? '-' : '+'} ${Math.abs(pVal)}</span>)`;
            let qStr = qVal === 0 ? '' : (qVal > 0 ? `+ ${qVal}` : `- ${Math.abs(qVal)}`);
            let qColorStr = qVal === 0 ? '' : `<span style="color:#38a169;">${qVal > 0 ? '+' : '-'} ${Math.abs(qVal)}</span>`;

            let finalEq;
            if (pVal === 0) {
                finalEq = `y = <span style="color:#805ad5;">${aStr}</span>x² ${qColorStr}`;
            } else {
                finalEq = `y = <span style="color:#805ad5;">${aStr}</span>${pColorStr}² ${qColorStr}`;
            }
            document.getElementById('quad-shift-formula').innerHTML = finalEq;

            // 🌟 대칭축 및 꼭짓점 텍스트 업데이트
            document.getElementById('quad-axis-info').innerText = `x = ${pVal}`;
            document.getElementById('quad-vertex-info').innerText = `(${pVal}, ${qVal})`;
        }

        function drawShiftGraph() {
            // 1. y = ax^2 (기본형, 흐릿하게 베이스로 깔아줌)
            qCtx.beginPath();
            qCtx.strokeStyle = 'rgba(160, 174, 192, 0.4)';
            qCtx.lineWidth = 2; qCtx.setLineDash([5, 5]);
            for (let x = -15; x <= 15; x += 0.1) {
                let y = aVal * (x * x);
                let px = offsetX + x * zoom; let py = offsetY - y * zoom;
                if (x === -15) qCtx.moveTo(px, py); else qCtx.lineTo(px, py);
            }
            qCtx.stroke(); qCtx.setLineDash([]);

            // 2. y = a(x-p)^2 + q (이동형, 진하게)
            qCtx.beginPath();
            qCtx.strokeStyle = '#a78bfa'; // 보라색
            qCtx.lineWidth = 4;
            for (let x = pVal - 15; x <= pVal + 15; x += 0.1) {
                let y = aVal * (x - pVal) * (x - pVal) + qVal;
                let px = offsetX + x * zoom; let py = offsetY - y * zoom;
                if (x === pVal - 15) qCtx.moveTo(px, py); else qCtx.lineTo(px, py);
            }
            qCtx.stroke();

            // 🌟 3. 대칭축 (x = p) 점선 그리기
            let vx = offsetX + pVal * zoom;
            let vy = offsetY - qVal * zoom;

            qCtx.beginPath();
            qCtx.moveTo(vx, 0);
            qCtx.lineTo(vx, qCanvas.height);
            qCtx.strokeStyle = 'rgba(229, 62, 62, 0.3)'; // 빨간색 점선
            qCtx.lineWidth = 2;
            qCtx.setLineDash([8, 6]);
            qCtx.stroke();
            qCtx.setLineDash([]);

            // 축 라벨 표시
            qCtx.fillStyle = '#e53e3e';
            qCtx.font = 'bold 14px Outfit';
            qCtx.fillText(`x = ${pVal}`, vx + 8, 20);

            // 4. 꼭짓점 마킹
            qCtx.beginPath(); qCtx.arc(vx, vy, 8, 0, Math.PI * 2);
            qCtx.fillStyle = '#a78bfa'; qCtx.fill(); qCtx.strokeStyle = 'white'; qCtx.lineWidth = 2; qCtx.stroke();

            // 꼭짓점 좌표 라벨 배경 흰색 처리 (선과 겹치지 않게)
            qCtx.font = '800 16px Outfit';
            qCtx.strokeStyle = '#ffffff'; qCtx.lineWidth = 4;
            qCtx.strokeText(`(${pVal}, ${qVal})`, vx + 12, vy - 12);
            qCtx.fillStyle = '#2d3748';
            qCtx.fillText(`(${pVal}, ${qVal})`, vx + 12, vy - 12);
        }

        /* ==================== 4. 최대/최소 로직 ==================== */
        const aInput = document.getElementById('quad-a-input');
        const bInput = document.getElementById('quad-b-input');
        const aSld = document.getElementById('quad-a-slider');
        const bSld = document.getElementById('quad-b-slider');

        function syncMaxMinInput(source) {
            if (source === 'slider') {
                let vA = parseFloat(aSld.value), vB = parseFloat(bSld.value);
                if (vA >= vB) { vA = vB - 0.1; aSld.value = vA; }
                rangeA = vA; rangeB = vB;
                aInput.value = vA.toFixed(1); bInput.value = vB.toFixed(1);
            } else if (source === 'input') {
                let vA = parseFloat(aInput.value), vB = parseFloat(bInput.value);
                if (isNaN(vA)) vA = rangeA; if (isNaN(vB)) vB = rangeB;
                if (vA >= vB) { vA = vB - 0.1; aInput.value = vA.toFixed(1); }
                rangeA = vA; rangeB = vB;
                if (vA < aSld.min) aSld.min = Math.floor(vA - 2);
                if (vB > bSld.max) bSld.max = Math.ceil(vB + 2);
                aSld.value = vA; bSld.value = vB;
            }
            drawQuad();
        }

        aSld.addEventListener('input', () => syncMaxMinInput('slider'));
        bSld.addEventListener('input', () => syncMaxMinInput('slider'));
        aInput.addEventListener('change', () => syncMaxMinInput('input'));
        bInput.addEventListener('change', () => syncMaxMinInput('input'));

        function parseAndDrawMaxMin() {
            try {
                quadExpr = math.parse(document.getElementById('quad-func-input').value.trim());
                quadExpr.evaluate({ x: 0 });
                document.getElementById('quad-error').innerText = "";
                drawQuad();
            } catch (e) { document.getElementById('quad-error').innerText = "수식 오류"; }
        }
        document.getElementById('quad-draw-btn').addEventListener('click', parseAndDrawMaxMin);

        function drawMaxMinGraph() {
            if (!quadExpr) return;
            const startX = (-offsetX / zoom) - 1, endX = ((qCanvas.width - offsetX) / zoom) + 1;
            const step = (endX - startX) / 800;

            qCtx.lineWidth = 3;
            let prevPx = null, prevPy = null;

            // 1. 전체 선 그리기
            for (let t = startX; t <= endX; t += step) {
                try {
                    let y = quadExpr.evaluate({ x: t });
                    if (isNaN(y) || !isFinite(y)) continue;
                    let px = offsetX + t * zoom, py = offsetY - y * zoom;
                    let isInside = (t >= rangeA && t <= rangeB);

                    if (prevPx !== null) {
                        qCtx.beginPath(); qCtx.moveTo(prevPx, prevPy); qCtx.lineTo(px, py);
                        if (isInside) {
                            qCtx.strokeStyle = '#4fd1c5'; // 사진과 동일한 예쁜 하늘색 실선
                            qCtx.globalAlpha = 1.0; qCtx.setLineDash([]); qCtx.lineWidth = 4;
                        } else {
                            qCtx.strokeStyle = '#a0aec0'; qCtx.globalAlpha = 0.5; qCtx.setLineDash([5, 5]); qCtx.lineWidth = 2;
                        }
                        qCtx.stroke();
                    }
                    prevPx = px; prevPy = py;
                } catch (e) { }
            }
            qCtx.setLineDash([]); qCtx.globalAlpha = 1.0;

            // 2. 구간 경계선 그리기
            let pxA = offsetX + rangeA * zoom, pxB = offsetX + rangeB * zoom;
            qCtx.beginPath(); qCtx.moveTo(pxA, 0); qCtx.lineTo(pxA, qCanvas.height);
            qCtx.strokeStyle = 'rgba(115, 165, 255, 0.4)'; qCtx.lineWidth = 2; qCtx.setLineDash([8, 4]); qCtx.stroke();
            qCtx.beginPath(); qCtx.moveTo(pxB, 0); qCtx.lineTo(pxB, qCanvas.height);
            qCtx.strokeStyle = 'rgba(255, 139, 173, 0.4)'; qCtx.stroke(); qCtx.setLineDash([]);

            // 🌟 3. 완벽한 최대/최소값 찾기 (중복 및 겹침 방지 완벽 적용) 🌟
            let maxVal = -Infinity, minVal = Infinity;
            let maxPts = [], minPts = [];
            const fineStep = (rangeB - rangeA) / 1000; // 정밀 탐색

            // 3-1) 최고/최저 높이 찾기
            for (let t = rangeA; t <= rangeB + fineStep / 2; t += fineStep) {
                let xVal = Math.min(t, rangeB);
                let y = quadExpr.evaluate({ x: xVal });
                if (y > maxVal) maxVal = y;
                if (y < minVal) minVal = y;
            }

            // 3-2) 그 높이와 일치하는 점들을 수집 (컴퓨터 계산 오차만 허용)
            for (let t = rangeA; t <= rangeB + fineStep / 2; t += fineStep) {
                let xVal = Math.min(t, rangeB);
                let y = quadExpr.evaluate({ x: xVal });
                let px = offsetX + xVal * zoom, py = offsetY - y * zoom;

                // 🌟 수정: 오차를 1e-5 로 극단적으로 줄이고, x거리가 0.5 이내인 점은 중복 방지
                if (Math.abs(y - maxVal) < 1e-5) {
                    if (!maxPts.some(pt => Math.abs(pt.x - xVal) < 0.5)) {
                        maxPts.push({ x: xVal, y: y, px: px, py: py });
                    }
                }

                if (Math.abs(y - minVal) < 1e-5) {
                    if (!minPts.some(pt => Math.abs(pt.x - xVal) < 0.5)) {
                        minPts.push({ x: xVal, y: y, px: px, py: py });
                    }
                }
            }

            // 🌟 4. 수집된 모든 최대/최소 지점에 마킹 & 라벨 텍스트 그리기
            maxPts.forEach(pt => {
                qCtx.beginPath(); qCtx.arc(pt.px, pt.py, 7, 0, Math.PI * 2);
                qCtx.fillStyle = '#e53e3e'; qCtx.fill(); qCtx.strokeStyle = '#fff'; qCtx.lineWidth = 2; qCtx.stroke();

                // 텍스트에 하얀색 테두리(Stroke)를 주어 선과 겹쳐도 잘 보이게 처리
                qCtx.font = '800 15px Outfit, sans-serif';
                qCtx.strokeStyle = '#ffffff'; qCtx.lineWidth = 3;
                qCtx.strokeText(`Max (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`, pt.px + 10, pt.py - 10);
                qCtx.fillStyle = '#e53e3e';
                qCtx.fillText(`Max (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`, pt.px + 10, pt.py - 10);
            });

            minPts.forEach(pt => {
                qCtx.beginPath(); qCtx.arc(pt.px, pt.py, 7, 0, Math.PI * 2);
                qCtx.fillStyle = '#3182ce'; qCtx.fill(); qCtx.strokeStyle = '#fff'; qCtx.lineWidth = 2; qCtx.stroke();

                qCtx.font = '800 15px Outfit, sans-serif';
                qCtx.strokeStyle = '#ffffff'; qCtx.lineWidth = 3;
                qCtx.strokeText(`Min (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`, pt.px + 10, pt.py + 25);
                qCtx.fillStyle = '#3182ce';
                qCtx.fillText(`Min (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`, pt.px + 10, pt.py + 25);
            });

            // 🌟 5. 좌측 결과 패널 업데이트 (사진과 동일한 UI 디자인 적용)
            if (maxPts.length > 0 && minPts.length > 0) {
                // 여러 개일 경우 콤마로 연결하여 표시 (예: "0.00, 4.00")
                let maxXs = maxPts.map(p => p.x.toFixed(2)).join(', ');
                let minXs = minPts.map(p => p.x.toFixed(2)).join(', ');

                document.getElementById('quad-analysis').innerHTML = `
                    <div style="margin-bottom: 12px; color: #718096; font-size: 14px;">구간: [ <strong>${rangeA.toFixed(2)}, ${rangeB.toFixed(2)}</strong> ]</div>
                    
                    <!-- 최댓값 박스 -->
                    <div style="background: #fff5f5; border-left: 5px solid #fc8181; border-radius: 8px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <div style="font-size: 14px; color: #4a5568; font-weight: 700; margin-bottom: 6px;">
                            <span style="color:#e53e3e; font-size: 16px;">x = ${maxXs}</span> 일 때
                        </div>
                        <div style="font-size: 15px; color: #4a5568; font-weight: 700;">
                            최댓값 <span style="color:#e53e3e; font-size:24px; font-weight: 800; margin-left: 5px;">${maxVal.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- 최솟값 박스 -->
                    <div style="background: #ebf4ff; border-left: 5px solid #73a5ff; border-radius: 8px; padding: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <div style="font-size: 14px; color: #4a5568; font-weight: 700; margin-bottom: 6px;">
                            <span style="color:#3182ce; font-size: 16px;">x = ${minXs}</span> 일 때
                        </div>
                        <div style="font-size: 15px; color: #4a5568; font-weight: 700;">
                            최솟값 <span style="color:#3182ce; font-size:24px; font-weight: 800; margin-left: 5px;">${minVal.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            }
        }

        /* ==================== 5. 통합 그리기 ==================== */
        function drawQuadGrid() {
            qCtx.clearRect(0, 0, qCanvas.width, qCanvas.height);
            qCtx.lineWidth = 1; qCtx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            let startCol = Math.floor(-offsetX / zoom), endCol = Math.ceil((qCanvas.width - offsetX) / zoom);
            for (let i = startCol; i <= endCol; i++) { let px = offsetX + i * zoom; qCtx.beginPath(); qCtx.moveTo(px, 0); qCtx.lineTo(px, qCanvas.height); qCtx.stroke(); }
            let startRow = Math.floor((offsetY - qCanvas.height) / zoom), endRow = Math.ceil(offsetY / zoom);
            for (let i = startRow; i <= endRow; i++) { let py = offsetY - i * zoom; qCtx.beginPath(); qCtx.moveTo(0, py); qCtx.lineTo(qCanvas.width, py); qCtx.stroke(); }

            qCtx.lineWidth = 2; qCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            qCtx.beginPath(); qCtx.moveTo(0, offsetY); qCtx.lineTo(qCanvas.width, offsetY); qCtx.stroke();
            qCtx.beginPath(); qCtx.moveTo(offsetX, 0); qCtx.lineTo(offsetX, qCanvas.height); qCtx.stroke();

            qCtx.fillStyle = '#718096'; qCtx.font = '12px Outfit';
            let stepSize = zoom < 20 ? 5 : (zoom < 40 ? 2 : 1);
            for (let i = startCol; i <= endCol; i++) if (i !== 0 && i % stepSize === 0) qCtx.fillText(i, offsetX + i * zoom - 5, offsetY + 16);
            for (let i = startRow; i <= endRow; i++) if (i !== 0 && i % stepSize === 0) qCtx.fillText(i, offsetX + 8, offsetY - i * zoom + 4);
            qCtx.fillText('O', offsetX - 12, offsetY + 15);
        }

        function drawQuad() {
            drawQuadGrid();
            if (currentQuadTab === 'shift') drawShiftGraph();
            else drawMaxMinGraph();
        }

        // 초기화 실행
        updateShiftFormula();
        parseAndDrawMaxMin();
    };
})();