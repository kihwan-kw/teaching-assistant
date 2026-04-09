const canvas = document.getElementById('mathCanvas');
        const ctx = canvas.getContext('2d');
        const slider = document.getElementById('angleSlider');
        const rSlider = document.getElementById('rSlider');
        const rVal = document.getElementById('rVal');
        const rSliderWrapper = document.getElementById('rSliderWrapper');
        const infoText = document.getElementById('infoText');
        const resetBtn = document.getElementById('resetBtn');
        const tabBtns = document.querySelectorAll('.tab-btn');

        const activeColors = {
            'sin': '#ff8bad',
            'cos': '#73a5ff',
            'tan': '#ffb86c',
            'definition': '#b19cd9'
        };

        const CX = 180; 
        const CY = 200; 
        const R_BASE = 90;  

        const GX = 380; 
        const GY = 200; 
        const X_SCALE_EXT = (Math.PI / 180) * R_BASE; 
        const G_WIDTH = 720 * X_SCALE_EXT; 
        const G_ORIGIN_X = GX + G_WIDTH / 2; 

        let currentFunc = 'definition';
        let currentAngle = 0;
        let currentR = 1.0; 
        let minReachedAngle = 0;
        let maxReachedAngle = 0;

        function init() {
            const indexTabs = document.querySelectorAll('.index-tab');
            const unitContents = document.querySelectorAll('.unit-content');

            indexTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    indexTabs.forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');

                    const targetUnit = e.target.dataset.unit;
                    unitContents.forEach(content => {
                        content.classList.remove('active');
                        if (content.id === 'unit-' + targetUnit) {
                            content.classList.add('active');
                        }
                    });
                });
            });

            slider.addEventListener('input', (e) => {
                currentAngle = parseInt(e.target.value);
                if (currentAngle > maxReachedAngle) maxReachedAngle = currentAngle;
                if (currentAngle < minReachedAngle) minReachedAngle = currentAngle;
                draw();
                updateTextExtended();
            });

            rSlider.addEventListener('input', (e) => {
                currentR = parseFloat(e.target.value);
                rVal.innerText = currentR.toFixed(1);
                draw();
            });

            resetBtn.addEventListener('click', () => {
                slider.value = 0;
                currentAngle = 0;
                minReachedAngle = 0;
                maxReachedAngle = 0;
                rSlider.value = 1.0;
                currentR = 1.0;
                rVal.innerText = "1.0";
                draw();
                updateTextExtended();
            });

            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    tabBtns.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    currentFunc = e.target.dataset.func;

                    if (currentFunc === 'definition') {
                        rSliderWrapper.style.display = 'flex';
                    } else {
                        rSliderWrapper.style.display = 'none';
                        currentR = 1.0; 
                        rSlider.value = 1.0;
                        rVal.innerText = "1.0";
                    }

                    slider.value = 0;
                    currentAngle = 0;
                    minReachedAngle = 0;
                    maxReachedAngle = 0;
                    draw();
                    updateTextExtended();
                });
            });

            rSliderWrapper.style.display = 'flex'; 
            draw();
            updateTextExtended();
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawAxes();

            if (currentFunc === 'definition') {
                drawDefinition();
            } else {
                drawUnitCircle(); 
                drawTraceExtended();
                drawCurrentStateExtended();
            }
        }

        function drawAxes() {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(CX - R_BASE - 40, CY); ctx.lineTo(CX + R_BASE + 40, CY); 
            ctx.moveTo(CX, CY - R_BASE - 40); ctx.lineTo(CX, CY + R_BASE + 40); 
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(GX - 30, GY); ctx.lineTo(GX + G_WIDTH + 30, GY); 
            ctx.moveTo(G_ORIGIN_X, 30); ctx.lineTo(G_ORIGIN_X, canvas.height - 30);     
            ctx.stroke();

            ctx.fillStyle = '#718096';
            ctx.font = '14px Outfit, sans-serif';

            ctx.fillText('1', CX + R_BASE + 8, CY - 8);
            ctx.fillText('-1', CX - R_BASE - 25, CY - 8);
            ctx.fillText('1', CX + 8, CY - R_BASE - 8);
            ctx.fillText('-1', CX + 8, CY + R_BASE + 20);

            const angles = [
                { deg: -360, label: '-2π' }, { deg: -270, label: '-3π/2' }, { deg: -180, label: '-π' }, { deg: -90, label: '-π/2' },
                { deg: 90, label: 'π/2' }, { deg: 180, label: 'π' }, { deg: 270, label: '3π/2' }, { deg: 360, label: '2π' }
            ];

            ctx.textAlign = 'center';
            angles.forEach(a => {
                const x = G_ORIGIN_X + a.deg * X_SCALE_EXT;
                ctx.beginPath();
                ctx.moveTo(x, GY - 5); ctx.lineTo(x, GY + 5);
                ctx.stroke();
                
                ctx.fillStyle = '#718096';
                ctx.font = '14px Outfit, sans-serif';
                ctx.fillText(a.label, x, GY + 22);
                
                ctx.fillStyle = '#a0aec0';
                ctx.font = '12px Outfit, sans-serif';
                ctx.fillText(a.deg + '°', x, GY + 38);
            });

            ctx.fillStyle = '#718096';
            ctx.font = '14px Outfit, sans-serif';
            ctx.fillText('0', G_ORIGIN_X, GY + 22);
            ctx.fillStyle = '#a0aec0';
            ctx.font = '12px Outfit, sans-serif';
            ctx.fillText('0°', G_ORIGIN_X, GY + 38);

            ctx.textAlign = 'left';
            ctx.fillStyle = '#718096';
            ctx.font = '14px Outfit, sans-serif';
            ctx.fillText('1', G_ORIGIN_X - 18, GY - R_BASE + 5);
            ctx.fillText('-1', G_ORIGIN_X - 22, GY + R_BASE + 5);
        }

        function drawUnitCircle() {
            ctx.beginPath();
            ctx.arc(CX, CY, R_BASE, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.stroke();
        }

        function drawCoordinates(x, y) {
            ctx.fillStyle = '#4a5568';
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText(`x = ${x.toFixed(2)}`, 20, 40);
            ctx.fillText(`y = ${y.toFixed(2)}`, 20, 70);
        }

        function drawPoint(x, y, borderCol, radius = 5, fillCol = '#ffffff') {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = fillCol;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = borderCol;
            ctx.stroke();
        }

        function drawDefinition() {
            let r_pixel = currentR * R_BASE;
            
            ctx.beginPath();
            ctx.arc(CX, CY, r_pixel, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.stroke();

            let rad = currentAngle * Math.PI / 180;
            let px = CX + r_pixel * Math.cos(rad);
            let py = CY - r_pixel * Math.sin(rad);
            let val_x = currentR * Math.cos(rad);
            let val_y = currentR * Math.sin(rad);

            ctx.beginPath();
            ctx.moveTo(CX, CY);
            ctx.lineTo(px, CY);
            ctx.lineTo(px, py);
            ctx.closePath();
            ctx.fillStyle = 'rgba(177, 156, 217, 0.15)'; 
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(CX, CY);
            ctx.lineTo(px, py);
            ctx.strokeStyle = activeColors['definition'];
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(px, py); ctx.lineTo(px, CY); 
            ctx.moveTo(px, py); ctx.lineTo(CX, py); 
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]); 

            drawPoint(px, py, activeColors['definition'], 5, '#ffffff');

            ctx.fillStyle = '#4a5568';
            ctx.font = '600 16px Outfit, sans-serif';
            ctx.fillText(`P(x,y)`, px + 10, py - 10);
            ctx.fillText('x', px, CY + 20);
            ctx.fillText('y', CX - 20, py + 5);

            ctx.beginPath();
            ctx.arc(CX, CY, 35, 0, -rad, currentAngle > 0);
            ctx.fillStyle = 'rgba(177, 156, 217, 0.2)';
            ctx.fill();
            ctx.strokeStyle = activeColors['definition'];
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = activeColors['definition'];
            let labelX = CX + 50 * Math.cos(-rad / 2);
            let labelY = CY + 50 * Math.sin(-rad / 2);
            ctx.fillText(`${currentAngle}°`, labelX, labelY);
            ctx.fillText('α', CX + 15, CY - 10);

            ctx.fillStyle = '#4a5568';
            ctx.fillText(`r = ${currentR.toFixed(1)}`, CX + 15, CY - r_pixel - 15);

            // 항상 좌표 표시
            drawCoordinates(val_x, val_y);

            const sinVal = Math.sin(rad);
            const cosVal = Math.cos(rad);
            const tanVal = Math.tan(rad);
            let tanStr = tanVal.toFixed(2);
            if (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270) {
                tanStr = "∞";
            }
            
            ctx.font = '600 20px Outfit, sans-serif';
            ctx.fillStyle = activeColors['sin']; 
            ctx.fillText(`sin(${currentAngle}°) = ${sinVal.toFixed(2)}`, G_ORIGIN_X + 60, CY + 80);
            ctx.fillStyle = activeColors['cos']; 
            ctx.fillText(`cos(${currentAngle}°) = ${cosVal.toFixed(2)}`, G_ORIGIN_X + 60, CY + 115);
            ctx.fillStyle = activeColors['tan']; 
            ctx.fillText(`tan(${currentAngle}°) = ${tanStr}`, G_ORIGIN_X + 60, CY + 150);
        }

        function drawTraceExtended() {
            ctx.save();
            ctx.beginPath();
            ctx.rect(GX, 0, G_WIDTH + 40, canvas.height); 
            ctx.clip();

            let activeColor = activeColors[currentFunc];

            ctx.beginPath();
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = activeColor;
            ctx.shadowBlur = 4;
            ctx.setLineDash([]);

            let minAngle = minReachedAngle, maxAngle = maxReachedAngle;
            
            for (let a = minAngle; a <= maxAngle; a++) {
                let rad = a * Math.PI / 180;
                let x = G_ORIGIN_X + a * X_SCALE_EXT; 
                let y;

                if (currentFunc === 'sin') y = GY - R_BASE * Math.sin(rad);
                else if (currentFunc === 'cos') y = GY - R_BASE * Math.cos(rad);
                else if (currentFunc === 'tan') y = GY - R_BASE * Math.tan(rad);

                if (currentFunc === 'tan' && (a === 90 || a === -90 || a === 270 || a === -270)) {
                    ctx.stroke();
                    ctx.beginPath();
                    continue;
                }

                if (a === minAngle || (currentFunc === 'tan' && (a === minAngle + 1))) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0; 
            ctx.restore(); 
        }

        function drawCurrentStateExtended() {
            let activeColor = activeColors[currentFunc];
            let rad = currentAngle * Math.PI / 180;
            let px = CX + R_BASE * Math.cos(rad);
            let py = CY - R_BASE * Math.sin(rad);
            let gx = G_ORIGIN_X + currentAngle * X_SCALE_EXT; 
            let gy;

            // 사인 코사인 탄젠트 탭에서도 항상 좌측 상단에 x y 좌표 표시
            let val_x = Math.cos(rad);
            let val_y = Math.sin(rad);
            drawCoordinates(val_x, val_y);

            if (currentFunc === 'sin') gy = GY - R_BASE * Math.sin(rad);
            else if (currentFunc === 'cos') gy = GY - R_BASE * Math.cos(rad);
            else if (currentFunc === 'tan') gy = GY - R_BASE * Math.tan(rad);

            ctx.beginPath();
            ctx.moveTo(CX, CY);
            ctx.lineTo(px, py);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(CX, CY, 30, 0, -rad, currentAngle > 0); 
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.lineWidth = 2;

            if (currentFunc === 'sin') {
                ctx.beginPath();
                ctx.moveTo(px, py); ctx.lineTo(px, CY);
                ctx.strokeStyle = activeColor;
                ctx.setLineDash([]);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(px, py); ctx.lineTo(gx, gy);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]); 

            } else if (currentFunc === 'cos') {
                ctx.beginPath();
                ctx.moveTo(CX, py); ctx.lineTo(px, py);
                ctx.strokeStyle = activeColor;
                ctx.setLineDash([]);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(px, py); ctx.lineTo(gx, gy);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]); 

            } else if (currentFunc === 'tan') {
                let tx = CX + R_BASE;
                if (currentAngle !== 90 && currentAngle !== -90 && currentAngle !== 270 && currentAngle !== -270) {
                    ctx.beginPath();
                    ctx.moveTo(CX, CY);
                    ctx.lineTo(tx, gy); 
                    ctx.strokeStyle = 'rgba(255, 184, 108, 0.4)';
                    ctx.setLineDash([]);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(tx, CY); ctx.lineTo(tx, gy);
                    ctx.strokeStyle = activeColor;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(tx, gy); ctx.lineTo(gx, gy);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]); 

                    drawPoint(tx, gy, activeColor, 4, '#ffffff');
                }
            }

            drawPoint(px, py, activeColor, 5, '#ffffff'); 

            if (currentFunc === 'tan' && (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270)) {
                return; 
            }
            if (gy >= 0 && gy <= canvas.height) {
                drawPoint(gx, gy, activeColor, 5, '#ffffff'); 
            }
        }

        function updateTextExtended() {
            if (currentFunc === 'definition') {
                infoText.innerHTML = `정의 (Definition)`;
                infoText.style.color = activeColors['definition'];
                return; 
            }

            let rad = currentAngle * Math.PI / 180;
            let val;
            let displayVal = "";
            let valColor = activeColors[currentFunc];

            if (currentFunc === 'sin') { val = Math.sin(rad); }
            else if (currentFunc === 'cos') { val = Math.cos(rad); }
            else if (currentFunc === 'tan') { val = Math.tan(rad); }

            if (currentFunc === 'tan' && (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270)) {
                displayVal = "∞";
            } else {
                displayVal = val.toFixed(2);
            }

            infoText.style.color = '#2d3748';
            infoText.innerHTML = `${currentFunc}(${currentAngle}°) = <span style="color: ${valColor};">${displayVal}</span>`;
        }

        init();


        /* --- Exponential & Logarithmic Functions Logic --- */
        const expCanvas = document.getElementById('expCanvas');
        const eCtx = expCanvas.getContext('2d');
        const funcInput = document.getElementById('funcInput');
        const drawBtn = document.getElementById('drawBtn');
        const funcError = document.getElementById('funcError');
        const historyList = document.getElementById('historyList');
        const colorBtns = document.querySelectorAll('.color-btn');

        // Defaults and Constants
        const EXP_CW = 1000;   // 1000
        const EXP_CH = 700;  // 700
        const EXP_CX = EXP_CW / 2;        // 350
        const EXP_CY = EXP_CH / 2;        // 250
        const UNIT_PX = 40;               // 1 unit = 40 pixels

        let selectedColor = '#ff8bad'; // Default selected color
        let functionHistory = [];      // Array to hold { id, exprStr, expr, color, visible, isInverse }
        let histIdCounter = 0;
        let selectedHistoryId = null;

        function getNextColor() {
            let colors = Array.from(colorBtns).map(b => b.dataset.color);
            let currIdx = colors.indexOf(selectedColor);
            let nextIdx = (currIdx + 1) % colors.length;
            let nextColor = colors[nextIdx];
            colorBtns.forEach(b => {
                b.classList.remove('active');
                if(b.dataset.color === nextColor) b.classList.add('active');
            });
            selectedColor = nextColor;
        }

        // --- Event Listeners for new UI ---
        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                colorBtns.forEach(b => b.classList.remove('active'));
                const target = e.target;
                target.classList.add('active');
                selectedColor = target.dataset.color;
            });
        });

        function drawExpGrid() {
            eCtx.clearRect(0, 0, EXP_CW, EXP_CH);
            
            eCtx.lineWidth = 1;
            eCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            
            // Vertical grid lines
            for (let x = 0; x <= EXP_CW; x += UNIT_PX) {
                eCtx.beginPath();
                eCtx.moveTo(x, 0);
                eCtx.lineTo(x, EXP_CH);
                eCtx.stroke();
            }
            // Horizontal grid lines
            for (let y = 0; y <= EXP_CH; y += UNIT_PX) {
                eCtx.beginPath();
                eCtx.moveTo(0, y);
                eCtx.lineTo(EXP_CW, y);
                eCtx.stroke();
            }

            // Axes
            eCtx.lineWidth = 2;
            eCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            eCtx.beginPath();
            eCtx.moveTo(0, EXP_CY);
            eCtx.lineTo(EXP_CW, EXP_CY); // X axis
            eCtx.moveTo(EXP_CX, 0);
            eCtx.lineTo(EXP_CX, EXP_CH); // Y axis
            eCtx.stroke();

            // Labels
            eCtx.fillStyle = '#718096';
            eCtx.font = '12px Outfit, sans-serif';
            for (let i = -15; i <= 15; i++) {
                if (i !== 0) {
                    let px = EXP_CX + i * UNIT_PX;
                    if (px >= 0 && px <= EXP_CW) {
                        eCtx.fillText(i, px - 4, EXP_CY + 15);
                    }
                    let py = EXP_CY - i * UNIT_PX;
                    if (py >= 0 && py <= EXP_CH) {
                        eCtx.fillText(i, EXP_CX + 8, py + 4);
                    }
                }
            }
            eCtx.fillText('O', EXP_CX - 12, EXP_CY + 15);
            eCtx.fillText('x', EXP_CW - 15, EXP_CY - 10);
            eCtx.fillText('y', EXP_CX + 10, 15);
        }

        function renderAllExpGraphs() {
            drawExpGrid();
            document.getElementById('graphLabels').innerHTML = '';

            const startX = -15;
            const endX = 15;
            const step = 0.05;

            functionHistory.forEach(item => {
                if (!item.visible) return;

                eCtx.beginPath();
                eCtx.lineWidth = 3;
                eCtx.strokeStyle = item.color;

                let labelCandidates = [];
                
                function getPt(t) {
                    let val;
                    try {
                        val = item.expr.evaluate({ x: t });
                    } catch (e) {
                        return null;
                    }

                    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
                        return null;
                    }

                    let px, py;
                    if (item.isInverse) {
                        px = EXP_CX + val * UNIT_PX;
                        py = EXP_CY - t * UNIT_PX;
                    } else {
                        px = EXP_CX + t * UNIT_PX;
                        py = EXP_CY - val * UNIT_PX;
                    }
                    return { x: px, y: py, t: t, val: val };
                }

                let rawPoints = [];
                for (let t = startX; t <= endX; t += step) {
                    rawPoints.push(getPt(t));
                }

                let refinedPoints = [];
                for (let i = 0; i < rawPoints.length - 1; i++) {
                    let p1 = rawPoints[i];
                    let p2 = rawPoints[i+1];
                    
                    refinedPoints.push(p1);
                    
                    if ((p1 === null && p2 !== null) || (p1 !== null && p2 === null)) {
                        let validT = p1 ? startX + i*step : startX + (i+1)*step;
                        let invalidT = p1 ? startX + (i+1)*step : startX + i*step;
                        
                        let extra = [];
                        for(let d=0; d<14; d++) {
                            let midT = (validT + invalidT) / 2;
                            let midPt = getPt(midT);
                            if (midPt) {
                                extra.push(midPt);
                                validT = midT;
                            } else {
                                invalidT = midT;
                            }
                        }
                        if (p1 !== null) {
                            refinedPoints.push(...extra);
                        } else {
                            refinedPoints.push(...extra.reverse());
                        }
                    }
                }
                refinedPoints.push(rawPoints[rawPoints.length - 1]);

                let MathAbs = Math.abs;
                let firstPoint = true;
                let prevPx = null;
                let prevPy = null;

                for (let i = 0; i < refinedPoints.length; i++) {
                    let pt = refinedPoints[i];
                    if (!pt) {
                        firstPoint = true;
                        continue;
                    }

                    if (item.isInverse) {
                        if (prevPx !== null && MathAbs(pt.x - prevPx) > EXP_CW / 2) firstPoint = true;
                    } else {
                        if (prevPy !== null && MathAbs(pt.y - prevPy) > EXP_CH / 2) firstPoint = true;
                    }

                    if (firstPoint) {
                        eCtx.moveTo(pt.x, pt.y);
                        firstPoint = false;
                    } else {
                        eCtx.lineTo(pt.x, pt.y);
                    }
                    prevPx = pt.x;
                    prevPy = pt.y;
                    
                    if (pt.x >= 0 && pt.x <= EXP_CW && pt.y >= 0 && pt.y <= EXP_CH) {
                        labelCandidates.push({x: pt.x, y: pt.y});
                    }
                }
                eCtx.stroke();
                
                if (labelCandidates.length > 0) {
                    let targetIdx = Math.floor(labelCandidates.length * 0.85);
                    let targetPt = labelCandidates[targetIdx];
                    if (targetPt.x > EXP_CW - 80) targetPt.x = EXP_CW - 80;
                    if (targetPt.y < 20) targetPt.y = 20;

                    let eqString = '';
                    if (item.isInverse) {
                        let cloned = item.expr.clone();
                        cloned = cloned.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse('y') : n);
                        eqString = 'x = ' + cloned.toTex();
                    } else {
                        eqString = 'y = ' + item.expr.toTex();
                    }
                    let texStr = '\\textcolor{' + item.color + '}{' + eqString + '}';
                    let labelDiv = document.createElement('div');
                    labelDiv.style.position = 'absolute';
                    labelDiv.style.left = (targetPt.x + 15) + 'px';
                    labelDiv.style.top = (targetPt.y - 25) + 'px';
                    labelDiv.style.color = item.color; 
                    labelDiv.style.fontSize = '18px';
                    labelDiv.style.textShadow = '0 0 4px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.9)';
                    katex.render(texStr, labelDiv, { throwOnError: false });
                    document.getElementById('graphLabels').appendChild(labelDiv);
                }
            });
        }

        function updateHistoryUI() {
            historyList.innerHTML = '';
            
            if (functionHistory.length === 0) {
                historyList.innerHTML = '<div style="text-align: center; color: #a0aec0; margin-top: 20px; font-size: 14px;">추가된 함수가 없습니다.</div>';
                return;
            }

            functionHistory.forEach((item) => {
                const div = document.createElement('div');
                div.className = 'history-item' + (item.visible ? '' : ' hidden-graph') + (item.id === selectedHistoryId ? ' selected' : '');
                
                let texHtml = '';
                let eqString = item.isInverse ? 'x = ' + item.expr.toTex() : 'y = ' + item.expr.toTex();
                try {
                    texHtml = katex.renderToString(eqString, { throwOnError: false, displayMode: false });
                } catch(e) {
                    texHtml = eqString;
                }

                div.innerHTML = `
                    <div class="history-item-header">
                        <div style="display: flex; align-items: center; width: 70%; overflow: hidden;">
                            <div class="history-item-color" style="background-color: ${item.color}; flex-shrink: 0;"></div>
                            <div class="history-item-expr" style="overflow-x: auto; overflow-y: hidden;" title="${eqString}">${texHtml}</div>
                        </div>
                        <div style="display: flex; gap: 5px; flex-shrink: 0;">
                            <button class="history-btn toggle-btn" data-id="${item.id}" title="보이기/숨기기">
                                ${item.visible ? '👁️' : '🙈'}
                            </button>
                            <button class="history-btn delete-btn" data-id="${item.id}" title="삭제">
                                ❌
                            </button>
                        </div>
                    </div>
                `;

                div.addEventListener('click', (e) => {
                    if (e.target.closest('.history-btn')) return;
                    selectedHistoryId = item.id;
                    updateHistoryUI();
                });

                historyList.appendChild(div);
            });

            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    const func = functionHistory.find(f => f.id === id);
                    if (func) {
                        func.visible = !func.visible;
                        updateHistoryUI();
                        renderAllExpGraphs();
                    }
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    functionHistory = functionHistory.filter(f => f.id !== id);
                    if (selectedHistoryId === id) selectedHistoryId = null;
                    updateHistoryUI();
                    renderAllExpGraphs();
                });
            });
        }

        function addFunction() {
            const exprStr = funcInput.value.trim();
            if (!exprStr) {
                funcError.innerText = "수식을 입력해주세요.";
                return;
            }
            
            let expr;
            try {
                expr = math.parse(exprStr);
                expr.evaluate({ x: 1 });
                funcError.innerText = "";
            } catch (err) {
                funcError.innerText = "수식이 올바르지 않습니다. (예: 2^x, log(x, 2))";
                return;
            }

            let newId = histIdCounter++;
            functionHistory.push({
                id: newId,
                exprStr: exprStr,
                expr: expr,
                color: selectedColor,
                visible: true,
                isInverse: false
            });
            
            selectedHistoryId = newId;

            getNextColor();
            funcInput.value = '';
            updateHistoryUI();
            renderAllExpGraphs();
        }

        function invertAST(node) {
            function containsX(n) {
                let hasX = false;
                n.traverse(function(child) {
                    if (child.isSymbolNode && child.name === 'x') hasX = true;
                });
                return hasX;
            }
            function solve(n, targetStr) {
                if (n.isSymbolNode && n.name === 'x') return targetStr;
                if (n.isParenthesisNode) return solve(n.content, targetStr);

                if (n.isOperatorNode) {
                    if (n.op === '+') {
                        let leftHasX = containsX(n.args[0]);
                        let A = leftHasX ? n.args[0] : n.args[1];
                        let B = leftHasX ? n.args[1] : n.args[0];
                        return solve(A, `(${targetStr}) - (${B.toString()})`);
                    }
                    if (n.op === '-') {
                        if (n.args.length === 1) {
                            return solve(n.args[0], `-(${targetStr})`);
                        } else {
                            let leftHasX = containsX(n.args[0]);
                            if (leftHasX) {
                                return solve(n.args[0], `(${targetStr}) + (${n.args[1].toString()})`);
                            } else {
                                return solve(n.args[1], `(${n.args[0].toString()}) - (${targetStr})`);
                            }
                        }
                    }
                    if (n.op === '*') {
                        let leftHasX = containsX(n.args[0]);
                        let A = leftHasX ? n.args[0] : n.args[1];
                        let B = leftHasX ? n.args[1] : n.args[0];
                        return solve(A, `(${targetStr}) / (${B.toString()})`);
                    }
                    if (n.op === '/') {
                        let leftHasX = containsX(n.args[0]);
                        if (leftHasX) {
                            return solve(n.args[0], `(${targetStr}) * (${n.args[1].toString()})`);
                        } else {
                            return solve(n.args[1], `(${n.args[0].toString()}) / (${targetStr})`);
                        }
                    }
                    if (n.op === '^') {
                        let leftHasX = containsX(n.args[0]);
                        if (!leftHasX) {
                            return solve(n.args[1], `log(${targetStr}, ${n.args[0].toString()})`);
                        }
                    }
                }
                
                if (n.isFunctionNode) {
                    if (n.fn.name === 'log' || n.fn.name === 'log10') {
                        let base = n.args.length > 1 ? n.args[1].toString() : (n.fn.name === 'log10' ? '10' : '2.718281828459045');
                        let A = n.args[0];
                        if (n.fn.name === 'log' && n.args.length === 1) {
                            return solve(A, `exp(${targetStr})`);
                        } else {
                            return solve(A, `(${base})^(${targetStr})`);
                        }
                    }
                    if (n.fn.name === 'exp') {
                        return solve(n.args[0], `log(${targetStr})`);
                    }
                }
                throw new Error('Unsupported AST format for algebraic inversion.');
            }
            
            let invStr = solve(node, 'x');
            return math.parse(invStr);
        }

        function applyGlobalTransform(action) {
            if (selectedHistoryId === null) {
                funcError.innerText = "대칭/평행 이동할 함수를 좌측 목록에서 선택해주신 뒤 눌러주세요.";
                setTimeout(() => funcError.innerText = "", 2000);
                return;
            }
            const func = functionHistory.find(f => f.id === selectedHistoryId);
            if (!func) return;

            let newExprStr = func.expr.toString();
            let newExpr = math.parse(newExprStr);
            let newIsInverse = func.isInverse;

            if (action === 'refX') {
                if (newIsInverse) {
                    newExpr = newExpr.transform(node => {
                        if (node.isSymbolNode && node.name === 'x') return math.parse('(-x)');
                        return node;
                    });
                } else {
                    newExpr = math.parse(`-(${newExpr.toString()})`);
                }
            } else if (action === 'refY') {
                if (newIsInverse) {
                    newExpr = math.parse(`-(${newExpr.toString()})`);
                } else {
                    newExpr = newExpr.transform(node => {
                        if (node.isSymbolNode && node.name === 'x') return math.parse('(-x)');
                        return node;
                    });
                }
            } else if (action === 'refOrigin') {
                newExpr = newExpr.transform(node => {
                    if (node.isSymbolNode && node.name === 'x') return math.parse('(-x)');
                    return node;
                });
                newExpr = math.parse(`-(${newExpr.toString()})`);
            } else if (action === 'refYX') {
                if (newIsInverse) {
                    newIsInverse = false;
                } else {
                    try {
                        let invAST = invertAST(newExpr);
                        newExpr = invAST;
                        newIsInverse = false;
                    } catch(e) {
                        newIsInverse = true;
                    }
                }
            } else if (action === 'shift') {
                let dx = parseFloat(document.getElementById('gShiftX').value) || 0;
                let dy = parseFloat(document.getElementById('gShiftY').value) || 0;
                if (dx === 0 && dy === 0) return;
                
                if (dx !== 0) {
                    if (newIsInverse) {
                        newExpr = math.parse(`(${newExpr.toString()}) + ${dx}`);
                    } else {
                        let rep = dx > 0 ? `(x - ${dx})` : `(x + ${-dx})`;
                        newExpr = newExpr.transform(node => {
                            if (node.isSymbolNode && node.name === 'x') return math.parse(rep);
                            return node;
                        });
                    }
                }
                if (dy !== 0) {
                    if (newIsInverse) {
                        let rep = dy > 0 ? `(x - ${dy})` : `(x + ${-dy})`;
                        newExpr = newExpr.transform(node => {
                            if (node.isSymbolNode && node.name === 'x') return math.parse(rep);
                            return node;
                        });
                    } else {
                        newExpr = math.parse(`(${newExpr.toString()}) + ${dy}`);
                    }
                }
            }

            try {
                newExpr = math.simplify(newExpr);
            } catch (e) {
                // 파싱 불가능한 복잡한 꼴이거나 에러 시 그대로 둠
            }

            let finalStr = newExpr.toString();
            newExpr = math.parse(finalStr);

            let newId = histIdCounter++;
            functionHistory.push({
                id: newId,
                exprStr: finalStr,
                expr: newExpr,
                color: selectedColor,
                visible: true,
                isInverse: newIsInverse
            });

            selectedHistoryId = newId;

            getNextColor();
            updateHistoryUI();
            renderAllExpGraphs();
        }

        // Initialize Exponential View
        drawExpGrid();
        updateHistoryUI();

        drawBtn.addEventListener('click', addFunction);
        funcInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addFunction();
        });

        document.querySelector('.g-ref-x').addEventListener('click', () => applyGlobalTransform('refX'));
        document.querySelector('.g-ref-y').addEventListener('click', () => applyGlobalTransform('refY'));
        document.querySelector('.g-ref-o').addEventListener('click', () => applyGlobalTransform('refOrigin'));
        document.querySelector('.g-ref-yx').addEventListener('click', () => applyGlobalTransform('refYX'));
        document.querySelector('.g-apply-shift').addEventListener('click', () => applyGlobalTransform('shift'));

        document.querySelectorAll('.k-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'k-clear') {
                    funcInput.value = '';
                } else if (btn.id === 'k-back') {
                    funcInput.value = funcInput.value.slice(0, -1);
                } else {
                    let addition = btn.dataset.val;
                    if (addition.includes('log') || addition.includes('exp')) {
                        // insert snippet and maybe move cursor, or just append
                        funcInput.value += addition;
                    } else {
                        funcInput.value += addition;
                    }
                }
                funcInput.focus();
            });
        });

        // Trigger redraw when switching to exp tab
        document.querySelector('.index-tab[data-unit="exp"]').addEventListener('click', () => {
            setTimeout(() => {
                renderAllExpGraphs();
            }, 50);
        });

