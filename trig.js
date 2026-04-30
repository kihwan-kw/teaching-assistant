(function () {
    /* ========================================================= */
    /* --- Trigonometry (삼각함수) Logic --- */
    /* ========================================================= */

    const canvas = document.getElementById('mathCanvas');
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('angleSlider');
    const rSlider = document.getElementById('rSlider');
    const rVal = document.getElementById('rVal');
    const rSliderWrapper = document.getElementById('rSliderWrapper');
    const infoText = document.getElementById('infoText');
    const resetBtn = document.getElementById('resetBtn');
    const tabBtns = document.querySelectorAll('#unit-trig .tab-btn');

    const activeColors = {
        'radian': '#4fd1c5',
        'sin': '#ff8bad',
        'cos': '#73a5ff',
        'tan': '#ffb86c',
        'definition': '#b19cd9'
    };

    let CX = 150;
    let CY = canvas.height / 2;
    let R_BASE = 108;

    const GRAPH_R_BASE = 108;
    const GX = 312;
    let GY = canvas.height / 2;
    const X_SCALE_EXT = (Math.PI / 180) * GRAPH_R_BASE;
    const G_WIDTH = 720 * X_SCALE_EXT;
    const G_ORIGIN_X = GX + G_WIDTH / 2;

    let currentFunc = 'radian';
    let currentAngle = 0;
    let currentR = 1.0;
    let minReachedAngle = 0;
    let maxReachedAngle = 0;
    let composeA = 1.0, composeB = 1.0, composeC = 0.0, composeD = 0.0;
    let composeFunc = 'sin';
    let intersectM = 0.1, intersectN = 0.0;
    let intersectA = 1.0, intersectB = 1.0, intersectC = 0.0, intersectD = 0.0;
    let intersectFunc = 'sin';
    let intersectUseDomain = false;
    let intersectDomainMin = -4.0, intersectDomainMax = 4.0;

    let sineLawAngleA = 70;
    let sineLawProofMode = false;

    // 코사인법칙 상태
    let cosineLawAngleC = 60;  // ∠C (도)
    let cosineLawSideB = 5;    // 변 b (CA)
    let cosineLawSideA = 6;    // 변 a (BC)
    let cosineLawShowProof = true;

    function initTrig() {
        slider.addEventListener('input', (e) => {
            currentAngle = parseInt(e.target.value);
            if (currentAngle > maxReachedAngle) maxReachedAngle = currentAngle;
            if (currentAngle < minReachedAngle) minReachedAngle = currentAngle;
            drawTrig();
            updateTextExtended();
        });

        rSlider.addEventListener('input', (e) => {
            currentR = parseFloat(e.target.value);
            rVal.innerText = currentR.toFixed(1);
            drawTrig();
        });

        resetBtn.addEventListener('click', () => {
            slider.value = 0;
            currentAngle = 0;
            minReachedAngle = 0;
            maxReachedAngle = 0;
            rSlider.value = 1.0;
            currentR = 1.0;
            rVal.innerText = "1.0";
            drawTrig();
            updateTextExtended();
        });

        const COMPOSE_BTN_STYLES = {
            sin: { active: 'background:linear-gradient(135deg,#ff8bad,#e53e3e);color:#fff;border:none;box-shadow:0 4px 14px rgba(229,62,62,0.35);', inactive: 'background:rgba(255,255,255,0.7);color:#e53e3e;border:2px solid #ff8bad;box-shadow:none;' },
            cos: { active: 'background:linear-gradient(135deg,#73a5ff,#3182ce);color:#fff;border:none;box-shadow:0 4px 14px rgba(49,130,206,0.35);', inactive: 'background:rgba(255,255,255,0.7);color:#3182ce;border:2px solid #73a5ff;box-shadow:none;' },
            tan: { active: 'background:linear-gradient(135deg,#ffb86c,#dd6b20);color:#fff;border:none;box-shadow:0 4px 14px rgba(221,107,32,0.35);', inactive: 'background:rgba(255,255,255,0.7);color:#dd6b20;border:2px solid #ffb86c;box-shadow:none;' }
        };

        function updateComposeBtnStyles() {
            document.querySelectorAll('.compose-func-btn').forEach(b => {
                const fn = b.dataset.fn;
                const base = 'font-weight:900;font-size:18px;padding:10px 36px;border-radius:50px;letter-spacing:1px;cursor:pointer;transition:all 0.25s;';
                b.style.cssText = base + (b.dataset.fn === composeFunc ? COMPOSE_BTN_STYLES[fn].active : COMPOSE_BTN_STYLES[fn].inactive);
            });
        }

        document.querySelectorAll('.compose-func-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                composeFunc = btn.dataset.fn;
                updateComposeBtnStyles();
                if (currentFunc === 'compose') drawTrig();
            });
        });
        updateComposeBtnStyles();

        document.getElementById('composeA').addEventListener('input', function () {
            composeA = parseFloat(this.value);
            document.getElementById('composeAVal').textContent = composeA.toFixed(1);
            if (currentFunc === 'compose') drawTrig();
        });
        document.getElementById('composeB').addEventListener('input', function () {
            composeB = parseFloat(this.value);
            document.getElementById('composeBVal').textContent = composeB.toFixed(1);
            if (currentFunc === 'compose') drawTrig();
        });
        document.getElementById('composeC').addEventListener('input', function () {
            composeC = parseFloat(this.value);
            document.getElementById('composeCVal').textContent = composeC.toFixed(1);
            if (currentFunc === 'compose') drawTrig();
        });
        document.getElementById('composeD').addEventListener('input', function () {
            composeD = parseFloat(this.value);
            document.getElementById('composeDVal').textContent = composeD.toFixed(1);
            if (currentFunc === 'compose') drawTrig();
        });

        function updateIntersectBtnStyles() {
            document.querySelectorAll('.intersect-func-btn').forEach(b => {
                const fn = b.dataset.fn;
                const base = 'font-weight:900;font-size:18px;padding:10px 36px;border-radius:50px;letter-spacing:1px;cursor:pointer;transition:all 0.25s;';
                b.style.cssText = base + (b.dataset.fn === intersectFunc ? COMPOSE_BTN_STYLES[fn].active : COMPOSE_BTN_STYLES[fn].inactive);
            });
        }

        document.querySelectorAll('.intersect-func-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                intersectFunc = btn.dataset.fn;
                updateIntersectBtnStyles();
                if (currentFunc === 'intersect') drawTrig();
            });
        });
        updateIntersectBtnStyles();

        document.getElementById('intersectM').addEventListener('input', function () {
            intersectM = parseFloat(this.value);
            document.getElementById('intersectMVal').textContent = intersectM.toFixed(2);
            if (currentFunc === 'intersect') drawTrig();
        });
        document.getElementById('intersectN').addEventListener('input', function () {
            intersectN = parseFloat(this.value);
            document.getElementById('intersectNVal').textContent = intersectN.toFixed(2);
            if (currentFunc === 'intersect') drawTrig();
        });
        document.getElementById('intersectA').addEventListener('input', function () {
            intersectA = parseFloat(this.value);
            document.getElementById('intersectAVal').textContent = intersectA.toFixed(1);
            if (currentFunc === 'intersect') drawTrig();
        });
        document.getElementById('intersectB').addEventListener('input', function () {
            intersectB = parseFloat(this.value);
            document.getElementById('intersectBVal').textContent = intersectB.toFixed(2) + 'π';
            if (currentFunc === 'intersect') drawTrig();
        });
        document.getElementById('intersectC').addEventListener('input', function () {
            intersectC = parseFloat(this.value);
            document.getElementById('intersectCVal').textContent = intersectC.toFixed(1);
            if (currentFunc === 'intersect') drawTrig();
        });
        document.getElementById('intersectD').addEventListener('input', function () {
            intersectD = parseFloat(this.value);
            document.getElementById('intersectDVal').textContent = intersectD.toFixed(1);
            if (currentFunc === 'intersect') drawTrig();
        });

        document.getElementById('intersectUseDomain').addEventListener('change', function () {
            intersectUseDomain = this.checked;
            document.getElementById('intersectDomainMin').disabled = !intersectUseDomain;
            document.getElementById('intersectDomainMax').disabled = !intersectUseDomain;
            if (currentFunc === 'intersect') drawTrig();
        });
        document.getElementById('intersectDomainMin').addEventListener('input', function () {
            intersectDomainMin = parseFloat(this.value);
            if (intersectDomainMin > intersectDomainMax) {
                intersectDomainMax = intersectDomainMin;
                document.getElementById('intersectDomainMax').value = intersectDomainMax;
                document.getElementById('intersectDomainMaxVal').textContent = intersectDomainMax.toFixed(1) + 'π';
            }
            document.getElementById('intersectDomainMinVal').textContent = intersectDomainMin.toFixed(1) + 'π';
            if (currentFunc === 'intersect') drawTrig();
        });
        document.getElementById('intersectDomainMax').addEventListener('input', function () {
            intersectDomainMax = parseFloat(this.value);
            if (intersectDomainMax < intersectDomainMin) {
                intersectDomainMin = intersectDomainMax;
                document.getElementById('intersectDomainMin').value = intersectDomainMin;
                document.getElementById('intersectDomainMinVal').textContent = intersectDomainMin.toFixed(1) + 'π';
            }
            document.getElementById('intersectDomainMaxVal').textContent = intersectDomainMax.toFixed(1) + 'π';
            if (currentFunc === 'intersect') drawTrig();
        });

        const sineLawAngleSlider = document.getElementById('sineLawAngleA');
        if (sineLawAngleSlider) {
            sineLawAngleSlider.addEventListener('input', function () {
                sineLawAngleA = parseInt(this.value);
                document.getElementById('sineLawAngleAVal').textContent = sineLawAngleA + '°';
                if (currentFunc === 'sineLaw') drawTrig();
            });
        }
        const sineLawProofToggle = document.getElementById('sineLawProofToggle');
        if (sineLawProofToggle) {
            sineLawProofToggle.addEventListener('change', function () {
                sineLawProofMode = this.checked;
                if (currentFunc === 'sineLaw') drawTrig();
            });
        }

        // 코사인법칙 슬라이더 이벤트
        const clAngleC = document.getElementById('cosineLawAngleC');
        if (clAngleC) {
            clAngleC.addEventListener('input', function () {
                cosineLawAngleC = parseInt(this.value);
                document.getElementById('cosineLawAngleCVal').textContent = cosineLawAngleC + '°';
                if (currentFunc === 'cosineLaw') drawTrig();
            });
        }
        const clSideB = document.getElementById('cosineLawSideBNew');
        if (clSideB) {
            clSideB.addEventListener('input', function () {
                cosineLawSideB = parseFloat(this.value);
                document.getElementById('cosineLawSideBNewVal').textContent = cosineLawSideB;
                if (currentFunc === 'cosineLaw') drawTrig();
            });
        }
        const clSideA = document.getElementById('cosineLawSideANew');
        if (clSideA) {
            clSideA.addEventListener('input', function () {
                cosineLawSideA = parseFloat(this.value);
                document.getElementById('cosineLawSideANewVal').textContent = cosineLawSideA;
                if (currentFunc === 'cosineLaw') drawTrig();
            });
        }
        const clProofToggle = document.getElementById('cosineLawProofToggle');
        if (clProofToggle) {
            clProofToggle.addEventListener('change', function () {
                cosineLawShowProof = this.checked;
                if (currentFunc === 'cosineLaw') drawTrig();
            });
        }

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentFunc = e.target.dataset.func;

                if (currentFunc === 'radian' || currentFunc === 'definition') {
                    CX = canvas.width / 2 - 250;
                    CY = canvas.height / 2;
                    R_BASE = 180;
                    rSliderWrapper.style.display = 'flex';
                } else {
                    CX = 150;
                    CY = canvas.height / 2;
                    R_BASE = 108;
                    GY = canvas.height / 2;
                    rSliderWrapper.style.display = 'none';
                    currentR = 1.0;
                    rSlider.value = 1.0;
                    rVal.innerText = "1.0";
                }

                if (currentFunc === 'radian') {
                    document.getElementById('radianControls').style.display = 'flex';
                } else {
                    document.getElementById('radianControls').style.display = 'none';
                }

                const isSpecial = ['compose', 'intersect', 'sineLaw', 'cosineLaw'].includes(currentFunc);
                if (isSpecial) {
                    document.getElementById('composeControls').style.display = currentFunc === 'compose' ? 'flex' : 'none';
                    document.getElementById('intersectControls').style.display = currentFunc === 'intersect' ? 'flex' : 'none';
                    const slc = document.getElementById('sineLawControls');
                    if (slc) slc.style.display = currentFunc === 'sineLaw' ? 'flex' : 'none';
                    const clc = document.getElementById('cosineLawControls');
                    if (clc) clc.style.display = currentFunc === 'cosineLaw' ? 'flex' : 'none';
                    document.getElementById('radianControls').style.display = 'none';
                    rSliderWrapper.style.display = 'none';
                    infoText.style.display = 'none';
                    document.getElementById('trig-slider-row').style.display = 'none';
                } else {
                    document.getElementById('composeControls').style.display = 'none';
                    document.getElementById('intersectControls').style.display = 'none';
                    const slc = document.getElementById('sineLawControls');
                    if (slc) slc.style.display = 'none';
                    const clc = document.getElementById('cosineLawControls');
                    if (clc) clc.style.display = 'none';
                    infoText.style.display = '';
                    document.getElementById('trig-slider-row').style.display = 'flex';
                }

                slider.value = 0;
                currentAngle = 0;
                minReachedAngle = 0;
                maxReachedAngle = 0;
                drawTrig();
                updateTextExtended();
            });
        });

        const setAngleFromRad = (radVal) => {
            let deg = radVal * 180 / Math.PI;
            currentAngle = deg;
            slider.value = Math.round(deg);
            drawTrig();
            updateTextExtended();
        };

        document.getElementById('btnRad1').addEventListener('click', () => setAngleFromRad(1));
        document.getElementById('btnRad2').addEventListener('click', () => setAngleFromRad(2));
        document.getElementById('btnRad3').addEventListener('click', () => setAngleFromRad(3));
        document.getElementById('btnRadPi').addEventListener('click', () => setAngleFromRad(Math.PI));

        CX = canvas.width / 2 - 250;
        CY = canvas.height / 2;
        R_BASE = 180;
        rSliderWrapper.style.display = 'flex';
        document.getElementById('radianControls').style.display = 'flex';

        drawTrig();
        updateTextExtended();
    }

    function drawTrig() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (currentFunc !== 'sineLaw') {
            drawAxes();
        }

        if (currentFunc === 'radian') {
            drawRadianConcept();
        } else if (currentFunc === 'definition') {
            drawDefinition();
        } else if (currentFunc === 'compose') {
            drawCompose();
        } else if (currentFunc === 'intersect') {
            drawIntersect();
        } else if (currentFunc === 'sineLaw') {
            drawSineLaw();
        } else if (currentFunc === 'cosineLaw') {
            drawCosineLaw();
        } else {
            drawUnitCircle();
            drawTraceExtended();
            drawCurrentStateExtended();
        }
    }

    function formatXValue(x) {
        const p = x / Math.PI;
        const denoms = [1, 2, 3, 4, 6];
        for (let d of denoms) {
            const num = Math.round(p * d);
            if (Math.abs(p * d - num) < 0.01) {
                if (num === 0) return '0';
                let sign = num < 0 ? '-' : '';
                let n = Math.abs(num);
                let gcd = function (a, b) { return b === 0 ? a : gcd(b, a % b); };
                let g = gcd(n, d);
                n /= g;
                let d_simp = d / g;
                let numStr = n === 1 ? 'π' : `${n}π`;
                if (d_simp === 1) return sign + numStr;
                return sign + numStr + '/' + d_simp;
            }
        }
        if (Math.abs(x - Math.round(x)) < 0.01) {
            return Math.round(x).toString();
        }
        return x.toFixed(2);
    }

    function drawIntersect() {
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const xScale = 80, yScale = 120;

        // 축 및 배경
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(W, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
        ctx.stroke();

        ctx.fillStyle = '#a0aec0'; ctx.font = '13px Outfit'; ctx.textAlign = 'center';
        for (let k = -8; k <= 8; k++) {
            const sx = cx + k * (Math.PI / 2) * xScale;
            ctx.beginPath(); ctx.moveTo(sx, cy - 5); ctx.lineTo(sx, cy + 5); ctx.stroke();
            if (k !== 0) {
                let label = '';
                if (k % 2 === 0) {
                    const piCount = k / 2;
                    label = piCount === 1 ? 'π' : piCount === -1 ? '-π' : piCount + 'π';
                } else {
                    const num = k === 1 ? '' : k === -1 ? '-' : k;
                    label = num + 'π/2';
                }
                ctx.fillText(label, sx, cy + 18);
            }
        }
        ctx.fillText('0', cx + 8, cy + 18);

        // 삼각함수 곡선
        ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2.5;
        let funcVals = [];
        let inPath = false;

        ctx.beginPath();
        for (let px = 0; px <= W; px++) {
            const x = (px - cx) / xScale;

            if (intersectUseDomain) {
                const domainMin = intersectDomainMin * Math.PI;
                const domainMax = intersectDomainMax * Math.PI;
                if (x < domainMin || x > domainMax) {
                    if (inPath) { ctx.stroke(); inPath = false; }
                    ctx.beginPath(); continue;
                }
            }

            let val = 0;
            const inner = intersectB * Math.PI * (x + intersectC);
            if (intersectFunc === 'sin') val = intersectA * Math.sin(inner) + intersectD;
            else if (intersectFunc === 'cos') val = intersectA * Math.cos(inner) + intersectD;
            else if (intersectFunc === 'tan') val = intersectA * Math.tan(inner) + intersectD;

            const y = cy - val * yScale;
            funcVals.push({ px, x, y, val });

            if (intersectFunc === 'tan' && (Math.abs(val) > H / yScale || !isFinite(val))) {
                if (inPath) { ctx.stroke(); inPath = false; }
                ctx.beginPath(); continue;
            }
            if (!inPath) { ctx.moveTo(px, y); inPath = true; }
            else { ctx.lineTo(px, y); }
        }
        if (inPath) ctx.stroke();

        // tan 점근선
        if (intersectFunc === 'tan') {
            ctx.save();
            ctx.strokeStyle = 'rgba(229,62,62,0.3)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            for (let n = -20; n <= 20; n++) {
                let asympX = (Math.PI / 2 + n * Math.PI) / (intersectB * Math.PI) - intersectC;
                if (intersectUseDomain) {
                    const domainMin = intersectDomainMin * Math.PI;
                    const domainMax = intersectDomainMax * Math.PI;
                    if (asympX < domainMin || asympX > domainMax) continue;
                }
                let asympPx = cx + asympX * xScale;
                if (asympPx >= 0 && asympPx <= W) {
                    ctx.beginPath(); ctx.moveTo(asympPx, 0); ctx.lineTo(asympPx, H); ctx.stroke();
                }
            }
            ctx.restore();
        }

        // 직선 그리기 y = mx + n
        ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 2;
        ctx.beginPath();
        const startX = (0 - cx) / xScale;
        const endX = (W - cx) / xScale;
        const startY = cy - (intersectM * startX + intersectN) * yScale;
        const endY = cy - (intersectM * endX + intersectN) * yScale;
        ctx.moveTo(0, startY);
        ctx.lineTo(W, endY);
        ctx.stroke();

        // 수식 텍스트
        ctx.fillStyle = '#2d3748'; ctx.font = 'bold 18px Outfit'; ctx.textAlign = 'left';
        let bStr = intersectB === 1 ? 'π' : intersectB.toFixed(2) + 'π';
        let cStr = intersectC === 0 ? '' : (intersectC > 0 ? ` + ${intersectC.toFixed(1)}` : ` - ${Math.abs(intersectC).toFixed(1)}`);
        let dStr = intersectD === 0 ? '' : (intersectD > 0 ? ` + ${intersectD.toFixed(1)}` : ` - ${Math.abs(intersectD).toFixed(1)}`);
        ctx.fillText(`y = ${intersectA.toFixed(1)}${intersectFunc}(${bStr}(x${cStr}))${dStr}`, 20, 36);
        ctx.fillText(`y = ${intersectM.toFixed(2)}x ${intersectN >= 0 ? '+' : '-'} ${Math.abs(intersectN).toFixed(2)}`, 20, 64);

        // 교점 찾기 및 표시
        let intersectPoints = [];
        let diffs = [];
        for (let i = 0; i < funcVals.length; i++) {
            const pt = funcVals[i];
            const lineY = intersectM * pt.x + intersectN;
            diffs.push(pt.val - lineY);
        }

        for (let i = 1; i < funcVals.length - 1; i++) {
            const pt = funcVals[i];
            if (intersectFunc === 'tan' && !isFinite(pt.val)) continue;

            const prevDiff = diffs[i - 1];
            const diff = diffs[i];
            const nextDiff = diffs[i + 1];

            let isIntersect = false;
            let ix, iy, realX;

            // 1. 교차 (Crossing)
            if (Math.sign(diff) !== Math.sign(prevDiff) && Math.sign(diff) !== 0 && Math.sign(prevDiff) !== 0) {
                if (intersectFunc !== 'tan' || Math.abs(diff - prevDiff) < 5) {
                    isIntersect = true;
                    const t = Math.abs(prevDiff) / (Math.abs(prevDiff) + Math.abs(diff));
                    ix = funcVals[i - 1].px + t * (pt.px - funcVals[i - 1].px);
                }
            }
            // 2. 접함 (Tangent touch)
            else if (Math.abs(diff) < 0.08) {
                if (Math.abs(diff) <= Math.abs(prevDiff) && Math.abs(diff) <= Math.abs(nextDiff)) {
                    if (intersectFunc !== 'tan' || Math.abs(diff - prevDiff) < 5) {
                        isIntersect = true;
                        ix = pt.px;
                    }
                }
            }

            if (isIntersect) {
                realX = (ix - cx) / xScale;
                iy = cy - (intersectM * realX + intersectN) * yScale;

                if (iy >= 0 && iy <= H) {
                    let duplicate = false;
                    if (intersectPoints.length > 0) {
                        const lastPt = intersectPoints[intersectPoints.length - 1];
                        if (Math.abs(lastPt.ix - ix) < 5) duplicate = true;
                    }
                    if (!duplicate) {
                        intersectPoints.push({ ix, iy, realX });
                    }
                }
            }
        }
        let intersections = intersectPoints.length;

        // 겹침 방지를 위해 교점별 라벨 높이 분산
        intersectPoints.sort((a, b) => a.ix - b.ix);
        for (let i = 0; i < intersectPoints.length; i++) {
            const pt = intersectPoints[i];

            // 점 찍기
            ctx.fillStyle = '#805ad5';
            ctx.beginPath();
            ctx.arc(pt.ix, pt.iy, 5, 0, Math.PI * 2);
            ctx.fill();

            // 수선의 발 (점선)
            ctx.strokeStyle = 'rgba(128, 90, 213, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(pt.ix, pt.iy);
            ctx.lineTo(pt.ix, cy);
            ctx.stroke();
            ctx.setLineDash([]);

            // 좌표 텍스트
            const xStr = formatXValue(pt.realX);
            ctx.font = 'bold 12px Outfit';
            ctx.fillStyle = '#553c9a';
            ctx.textAlign = 'center';

            // y 오프셋 계산 (겹침 방지)
            let yOffset = 18;
            if (i > 0 && (pt.ix - intersectPoints[i - 1].ix) < 40) {
                // 이전 점과 가까우면 다른 높이에 출력
                yOffset = intersectPoints[i - 1].yOffset === 18 ? 32 : 18;
            }
            pt.yOffset = yOffset;

            ctx.fillText(xStr, pt.ix, cy + yOffset);
        }

        const infoEl = document.getElementById('intersectInfo');
        if (infoEl) {
            infoEl.innerHTML = `서로 다른 교점의 개수: <span style="color:#e53e3e">${intersections}</span>개`;
        }
    }

    function drawCompose() {
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const xScale = 80, yScale = 120;

        // 축
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(W, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
        ctx.stroke();

        // x축 눈금 (π/2 단위)
        ctx.fillStyle = '#a0aec0'; ctx.font = '13px Outfit'; ctx.textAlign = 'center';
        for (let k = -8; k <= 8; k++) {
            const sx = cx + k * (Math.PI / 2) * xScale;
            ctx.beginPath(); ctx.moveTo(sx, cy - 5); ctx.lineTo(sx, cy + 5); ctx.stroke();
            if (k !== 0) {
                let label = '';
                if (k % 2 === 0) {
                    const piCount = k / 2;
                    label = piCount === 1 ? 'π' : piCount === -1 ? '-π' : piCount + 'π';
                } else {
                    const num = k === 1 ? '' : k === -1 ? '-' : k;
                    label = num + 'π/2';
                }
                ctx.fillText(label, sx, cy + 18);
            }
        }
        ctx.fillText('0', cx + 8, cy + 18);

        // 기준선 — 회색 (tan은 branch 분리)
        ctx.strokeStyle = 'rgba(160,174,192,0.5)'; ctx.lineWidth = 1.5;
        if (composeFunc === 'tan') {
            ctx.save();
            ctx.strokeStyle = 'rgba(160,174,192,0.3)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            for (let n = -10; n <= 10; n++) {
                let asympX = Math.PI / 2 + n * Math.PI;
                let asympPx = cx + asympX * xScale;
                ctx.beginPath(); ctx.moveTo(asympPx, 0); ctx.lineTo(asympPx, H); ctx.stroke();
            }
            ctx.restore();

            let inPath = false;
            for (let px = 0; px <= W; px++) {
                const x = (px - cx) / xScale;
                const base = Math.tan(x);
                const y = cy - base * yScale;
                if (Math.abs(base) > 12 || !isFinite(base)) { if (inPath) { ctx.stroke(); inPath = false; } ctx.beginPath(); continue; }
                if (!inPath) { ctx.beginPath(); ctx.moveTo(px, y); inPath = true; } else { ctx.lineTo(px, y); }
            }
            if (inPath) ctx.stroke();
        } else {
            ctx.beginPath();
            for (let px = 0; px <= W; px++) {
                const x = (px - cx) / xScale;
                const base = composeFunc === 'cos' ? Math.cos(x) : Math.sin(x);
                const y = cy - base * yScale;
                px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
            }
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(160,174,192,0.6)'; ctx.font = '13px Outfit'; ctx.textAlign = 'left';
        ctx.fillText(`y = ${composeFunc} x`, cx + Math.PI * xScale + 4, cy - yScale - 6);

        // a·f(b(x + c)) + d — 메인 곡선 (tan은 branch 분리)
        ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 3;
        if (composeFunc === 'tan') {
            ctx.save();
            ctx.strokeStyle = 'rgba(229,62,62,0.4)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            for (let n = -20; n <= 20; n++) {
                let asympX = (Math.PI / 2 + n * Math.PI) / composeB - composeC;
                let asympPx = cx + asympX * xScale;
                if (asympPx >= 0 && asympPx <= W) {
                    ctx.beginPath(); ctx.moveTo(asympPx, 0); ctx.lineTo(asympPx, H); ctx.stroke();
                }
            }
            ctx.restore();

            let inPath = false;
            let prevY = null;
            for (let px = 0; px <= W; px++) {
                const x = (px - cx) / xScale;
                const val = Math.tan(composeB * (x + composeC));
                const y = cy - (composeA * val + composeD) * yScale;
                // 점근선 감지: 값이 너무 크거나, 이전 픽셀과의 y 변화량이 캔버스 높이의 2배 이상이면 새 branch
                const jump = prevY !== null && Math.abs(y - prevY) > H * 1.5;
                if (!isFinite(val) || Math.abs(composeA * val) > H / yScale + 2 || jump) {
                    if (inPath) { ctx.stroke(); inPath = false; }
                    ctx.beginPath(); prevY = null; continue;
                }
                if (!inPath) { ctx.beginPath(); ctx.moveTo(px, y); inPath = true; } else { ctx.lineTo(px, y); }
                prevY = y;
            }
            if (inPath) ctx.stroke();
        } else {
            ctx.beginPath();
            for (let px = 0; px <= W; px++) {
                const x = (px - cx) / xScale;
                const val = composeFunc === 'cos' ? Math.cos(composeB * (x + composeC)) : Math.sin(composeB * (x + composeC));
                const y = cy - (composeA * val + composeD) * yScale;
                px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
            }
            ctx.stroke();
        }

        // 진폭선 표시 (tan 제외)
        if (composeFunc !== 'tan' && Math.abs(composeA) > 0.05) {
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = 'rgba(229,62,62,0.4)'; ctx.lineWidth = 1;
            [(composeA + composeD) * yScale, (-composeA + composeD) * yScale].forEach(dy => {
                ctx.beginPath(); ctx.moveTo(0, cy - dy); ctx.lineTo(W, cy - dy); ctx.stroke();
            });
            // 중심선 (d) 표시
            ctx.strokeStyle = 'rgba(56,161,105,0.4)';
            ctx.beginPath(); ctx.moveTo(0, cy - composeD * yScale); ctx.lineTo(W, cy - composeD * yScale); ctx.stroke();

            ctx.setLineDash([]);
            ctx.fillStyle = '#e53e3e'; ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'right';
            ctx.fillText(`|a| = ${Math.abs(composeA).toFixed(1)}`, cx - 8, cy - (Math.abs(composeA) + composeD) * yScale - 4);
        }

        // 주기 계산 (tan은 π/|b|, sin/cos는 2π/|b|)
        const isTan = composeFunc === 'tan';
        const period = (isTan ? Math.PI : 2 * Math.PI) / Math.abs(composeB);
        const periodPx = period * xScale;
        ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(cx, cy + 20); ctx.lineTo(cx + periodPx, cy + 20); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(cx, cy + 15); ctx.lineTo(cx, cy + 25);
        ctx.moveTo(cx + periodPx, cy + 15); ctx.lineTo(cx + periodPx, cy + 25);
        ctx.stroke();
        ctx.fillStyle = '#3182ce'; ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'center';
        const periodLabel = isTan
            ? `주기 = π/${composeB % 1 === 0 ? composeB : composeB.toFixed(1)}`
            : `주기 = 2π/${composeB % 1 === 0 ? composeB : composeB.toFixed(1)}`;
        ctx.fillText(periodLabel, cx + periodPx / 2, cy + 38);

        // x축 평행이동 표시
        if (Math.abs(composeC) > 0.05) {
            const shift = -composeC; // b(x+c) = 0 => x = -c
            const shiftPx = shift * xScale;
            ctx.strokeStyle = '#805ad5'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + shiftPx, cy - 10); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#805ad5'; ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'center';
            ctx.fillText(`x축 이동 ${shift > 0 ? '+' : ''}${shift.toFixed(2)}`, cx + shiftPx / 2, cy - 20);
        }

        // 수식 표시
        const aStr = composeA === 1 ? '' : composeA === -1 ? '-' : composeA.toFixed(1);
        const bStr = composeB === 1 ? '' : composeB.toFixed(1);
        const cStr = Math.abs(composeC) < 0.05 ? '' : (composeC > 0 ? ` + ${composeC.toFixed(1)}` : ` - ${Math.abs(composeC).toFixed(1)}`);
        const dStr = Math.abs(composeD) < 0.05 ? '' : (composeD > 0 ? ` + ${composeD.toFixed(1)}` : ` - ${Math.abs(composeD).toFixed(1)}`);
        const bGroupStr = bStr === '' ? `x${cStr}` : `${bStr}(x${cStr})`;
        const formula = `y = ${aStr}${composeFunc}(${bGroupStr})${dStr}`;
        ctx.fillStyle = '#2d3748'; ctx.font = 'bold 18px Outfit'; ctx.textAlign = 'left';
        ctx.fillText(formula, 20, 36);

        // 하단 정보 업데이트
        const infoEl = document.getElementById('composeInfo');
        const periodStr = isTan
            ? `π/${composeB % 1 === 0 ? composeB : composeB.toFixed(1)}`
            : `2π/${composeB % 1 === 0 ? composeB : composeB.toFixed(1)}`;
        if (infoEl) infoEl.innerHTML =
            (composeFunc !== 'tan' ? `진폭 <b style="color:#e53e3e">${Math.abs(composeA).toFixed(1)}</b> &nbsp;|&nbsp; ` : '') +
            `주기 <b style="color:#3182ce">${periodStr}</b> &nbsp;|&nbsp; ` +
            `x축 이동 <b style="color:#805ad5">${(-composeC).toFixed(2)}</b> &nbsp;|&nbsp; ` +
            `y축 이동 <b style="color:#38a169">${composeD.toFixed(1)}</b>`;
    }

    function drawAxes() {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(CX - R_BASE - 60, CY); ctx.lineTo(CX + R_BASE + 60, CY);
        ctx.moveTo(CX, CY - R_BASE - 60); ctx.lineTo(CX, CY + R_BASE + 60);
        ctx.stroke();

        ctx.fillStyle = '#718096';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('1', CX + R_BASE + 8, CY - 8);
        ctx.fillText('-1', CX - R_BASE - 25, CY - 8);
        ctx.fillText('1', CX + 8, CY - R_BASE - 8);
        ctx.fillText('-1', CX + 8, CY + R_BASE + 20);

        if (currentFunc === 'sin' || currentFunc === 'cos' || currentFunc === 'tan') {
            ctx.beginPath();
            ctx.moveTo(GX - 30, GY); ctx.lineTo(GX + G_WIDTH + 30, GY);
            ctx.moveTo(G_ORIGIN_X, 30); ctx.lineTo(G_ORIGIN_X, canvas.height - 30);
            ctx.stroke();

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
        if (currentFunc === 'sin' || currentFunc === 'cos' || currentFunc === 'tan') {
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText(`x = ${x.toFixed(2)}`, 20, 40);
            ctx.fillText(`y = ${y.toFixed(2)}`, 20, 70);
        } else {
            ctx.font = '800 24px Outfit, sans-serif';
            let startX = CX - R_BASE - 150;
            let startY = CY - R_BASE + 20;
            ctx.fillText(`x = ${x.toFixed(2)}`, startX, startY);
            ctx.fillText(`y = ${y.toFixed(2)}`, startX, startY + 40);
        }
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
        drawCoordinates(val_x, val_y);

        const sinVal = Math.sin(rad);
        const cosVal = Math.cos(rad);
        const tanVal = Math.tan(rad);
        let tanStr = tanVal.toFixed(2);
        if (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270) tanStr = "∞";

        let textStartX = CX + R_BASE + 80;
        let textStartY = CY - 40;
        ctx.font = '800 28px Outfit, sans-serif';
        ctx.fillStyle = activeColors['sin'];
        ctx.fillText(`sin(${currentAngle}°) = ${sinVal.toFixed(2)}`, textStartX, textStartY);
        ctx.fillStyle = activeColors['cos'];
        ctx.fillText(`cos(${currentAngle}°) = ${cosVal.toFixed(2)}`, textStartX, textStartY + 50);
        ctx.fillStyle = activeColors['tan'];
        ctx.fillText(`tan(${currentAngle}°) = ${tanStr}`, textStartX, textStartY + 100);
    }

    function drawRadianConcept() {
        let r_pixel = currentR * R_BASE;
        ctx.beginPath();
        ctx.arc(CX, CY, r_pixel, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        let rad = currentAngle * Math.PI / 180;
        let absRad = Math.abs(rad);
        let sign = currentAngle >= 0 ? -1 : 1;

        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(CX + r_pixel, CY);
        ctx.strokeStyle = '#a0aec0';
        ctx.lineWidth = 2;
        ctx.stroke();

        let px = CX + r_pixel * Math.cos(rad);
        let py = CY - r_pixel * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(px, py);
        ctx.strokeStyle = '#4a5568';
        ctx.stroke();

        let fullRads = Math.floor(absRad);
        let colors = ['#4fd1c5', '#38b2ac', '#319795', '#285e61', '#234e52', '#1d4044'];

        for (let i = 0; i < fullRads; i++) {
            let startA = sign * i;
            let endA = sign * (i + 1);
            let midA = sign * (i + 0.5);

            ctx.beginPath();
            ctx.arc(CX, CY, r_pixel, startA, endA, sign < 0);
            ctx.strokeStyle = colors[i % colors.length];
            ctx.lineWidth = 6;
            ctx.stroke();

            let outX = CX + (r_pixel + 20) * Math.cos(midA);
            let outY = CY + (r_pixel + 20) * Math.sin(midA);
            ctx.fillStyle = colors[i % colors.length];
            ctx.font = '800 16px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`r`, outX, outY + 5);

            ctx.beginPath();
            ctx.arc(CX, CY, 40 + i * 2, startA, endA, sign < 0);
            ctx.strokeStyle = colors[i % colors.length];
            ctx.lineWidth = 2;
            ctx.stroke();

            let inX = CX + 70 * Math.cos(midA);
            let inY = CY + 70 * Math.sin(midA);
            ctx.font = '600 13px Outfit, sans-serif';
            ctx.fillText(`1 rad`, inX, inY + 4);
        }

        if (absRad > fullRads) {
            let startA = sign * fullRads;
            let endA = sign * absRad;
            let midA = (startA + endA) / 2;
            let diffRad = absRad - fullRads;

            ctx.beginPath();
            ctx.arc(CX, CY, r_pixel, startA, endA, sign < 0);
            ctx.strokeStyle = '#fc8181';
            ctx.lineWidth = 6;
            ctx.stroke();

            let outX = CX + (r_pixel + 25) * Math.cos(midA);
            let outY = CY + (r_pixel + 25) * Math.sin(midA);
            ctx.fillStyle = '#fc8181';
            ctx.font = '800 14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${diffRad.toFixed(2)} r`, outX, outY + 5);

            ctx.beginPath();
            ctx.arc(CX, CY, 40 + fullRads * 2, startA, endA, sign < 0);
            ctx.strokeStyle = '#fc8181';
            ctx.lineWidth = 2;
            ctx.stroke();

            let inX = CX + 70 * Math.cos(midA);
            let inY = CY + 70 * Math.sin(midA);
            ctx.font = '600 12px Outfit, sans-serif';
            ctx.fillText(`${diffRad.toFixed(2)} rad`, inX, inY + 4);
        }
        ctx.textAlign = 'left';

        let rightX = CX + R_BASE + 80;
        let rightY = CY - 80;

        ctx.fillStyle = '#2d3748';
        ctx.font = '800 24px Outfit, sans-serif';
        ctx.fillText(`호도법 (Radian Measure)`, rightX, rightY);
        ctx.font = '600 18px Outfit, sans-serif';
        ctx.fillStyle = '#718096';
        ctx.fillText(`반지름 길이를 단위로 하여 중심각을 재는 방법`, rightX, rightY + 30);
        ctx.fillStyle = '#4a5568';
        ctx.fillText(`반지름 r = ${currentR.toFixed(1)}`, rightX, rightY + 70);
        ctx.fillText(`호의 길이 l = `, rightX, rightY + 95);
        ctx.fillStyle = '#4fd1c5';
        ctx.font = '800 20px Outfit, sans-serif';
        ctx.fillText(`${absRad.toFixed(2)}`, rightX + 105, rightY + 95);
        ctx.fillStyle = '#4a5568';
        ctx.font = '600 18px Outfit, sans-serif';
        ctx.fillText(` × r`, rightX + 145, rightY + 95);
        ctx.fillStyle = '#4fd1c5';
        ctx.font = '800 22px Outfit, sans-serif';
        ctx.fillText(`중심각 = ${absRad.toFixed(2)} 라디안`, rightX, rightY + 140);
        ctx.fillStyle = '#a0aec0';
        ctx.font = '600 16px Outfit, sans-serif';
        ctx.fillText(`( 1 라디안 ≈ 57.3° )`, rightX + 220, rightY + 140);

        if (Math.abs(currentAngle) === 180) {
            ctx.fillStyle = '#e53e3e';
            ctx.font = '800 28px Outfit, sans-serif';
            ctx.fillText(`π 라디안 = 180°`, rightX, rightY + 190);
            ctx.font = '600 16px Outfit, sans-serif';
            ctx.fillStyle = '#718096';
            ctx.fillText(`(반원의 호의 길이는 πr 이므로, 중심각은 π 라디안)`, rightX, rightY + 220);
        }
    }

    function drawTraceExtended() {
        ctx.save();
        ctx.beginPath();
        ctx.rect(GX, 0, G_WIDTH + 40, canvas.height);
        ctx.clip();

        if (currentFunc === 'tan') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 184, 108, 0.4)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            for (let a = -1080; a <= 1080; a += 180) {
                let asympAngle = 90 + a;
                if (asympAngle >= minReachedAngle && asympAngle <= maxReachedAngle) {
                    let gxAsymp = G_ORIGIN_X + asympAngle * X_SCALE_EXT;
                    ctx.beginPath(); ctx.moveTo(gxAsymp, 0); ctx.lineTo(gxAsymp, canvas.height); ctx.stroke();
                }
            }
            ctx.restore();
        }

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

            if (currentFunc === 'sin') y = GY - GRAPH_R_BASE * Math.sin(rad);
            else if (currentFunc === 'cos') y = GY - GRAPH_R_BASE * Math.cos(rad);
            else if (currentFunc === 'tan') y = GY - GRAPH_R_BASE * Math.tan(rad);

            if (currentFunc === 'tan' && (a === 90 || a === -90 || a === 270 || a === -270)) {
                ctx.stroke(); ctx.beginPath(); continue;
            }
            if (a === minAngle || (currentFunc === 'tan' && (a === minAngle + 1))) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
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

        drawCoordinates(Math.cos(rad), Math.sin(rad));

        if (currentFunc === 'sin') gy = GY - GRAPH_R_BASE * Math.sin(rad);
        else if (currentFunc === 'cos') gy = GY - GRAPH_R_BASE * Math.cos(rad);
        else if (currentFunc === 'tan') gy = GY - GRAPH_R_BASE * Math.tan(rad);

        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(px, py);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(CX, CY, 30, 0, -rad, currentAngle > 0);
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
            ctx.moveTo(px, py); ctx.lineTo(px, CY);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(CX, CY); ctx.lineTo(px, CY);
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.lineWidth = 2;
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

        if (currentFunc === 'tan' && (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270)) return;
        if (gy >= 0 && gy <= canvas.height) drawPoint(gx, gy, activeColor, 5, '#ffffff');
    }

    function updateTextExtended() {
        if (currentFunc === 'definition' || currentFunc === 'radian' || currentFunc === 'compose' || currentFunc === 'intersect' || currentFunc === 'sineLaw' || currentFunc === 'cosineLaw') {
            infoText.style.display = 'none';
            return;
        }
        infoText.style.display = '';

        let rad = currentAngle * Math.PI / 180;
        let val;
        let displayVal = "";
        let valColor = activeColors[currentFunc];

        if (currentFunc === 'sin') val = Math.sin(rad);
        else if (currentFunc === 'cos') val = Math.cos(rad);
        else if (currentFunc === 'tan') val = Math.tan(rad);

        if (currentFunc === 'tan' && (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270)) {
            displayVal = "∞";
        } else {
            displayVal = val.toFixed(2);
        }

        infoText.style.color = '#2d3748';
        infoText.innerHTML = `${currentFunc}(${currentAngle}°) = <span style="color: ${valColor};">${displayVal}</span>`;
    }

    function drawSineLaw() {
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const R = 180;

        // Draw circumcircle
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, 2 * Math.PI);
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center point O
        drawPoint(cx, cy, '#4a5568', 5, '#ffffff');
        ctx.fillStyle = '#4a5568';
        ctx.font = 'bold 16px Outfit';
        ctx.textAlign = 'left';
        ctx.fillText('O', cx + 10, cy + 22);

        const alphaDeg = sineLawAngleA;
        const alpha = alphaDeg * Math.PI / 180;

        // A, B, C positions
        // A is at top (-90 degrees)
        const aAngle = -Math.PI / 2;
        // B and C are placed symmetrically around bottom (90 degrees)
        const bAngle = Math.PI / 2 + alpha;
        const cAngle = Math.PI / 2 - alpha;

        const Ax = cx + R * Math.cos(aAngle);
        const Ay = cy + R * Math.sin(aAngle);
        const Bx = cx + R * Math.cos(bAngle);
        const By = cy + R * Math.sin(bAngle);
        const Cx = cx + R * Math.cos(cAngle);
        const Cy = cy + R * Math.sin(cAngle);

        // Draw proof construction if enabled
        if (sineLawProofMode) {
            // A' is exactly opposite to B
            const aPrimeAngle = bAngle - Math.PI;
            const Apx = cx + R * Math.cos(aPrimeAngle);
            const Apy = cy + R * Math.sin(aPrimeAngle);

            // Diameter B -> A'
            ctx.beginPath();
            ctx.moveTo(Bx, By);
            ctx.lineTo(Apx, Apy);
            ctx.strokeStyle = '#e53e3e';
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 2;
            ctx.stroke();

            // A' -> C
            ctx.beginPath();
            ctx.moveTo(Apx, Apy);
            ctx.lineTo(Cx, Cy);
            ctx.stroke();
            ctx.setLineDash([]);

            // A=90일 때는 A', 각도 표시 숨김
            if (Math.abs(alphaDeg - 90) > 1) {
                // Label A'
                drawPoint(Apx, Apy, '#e53e3e', 5, '#ffffff');
                ctx.font = 'bold 16px Outfit';
                ctx.fillStyle = '#e53e3e';
                ctx.textAlign = 'right';
                ctx.fillText("A'", Apx - 10, Apy - 10);

                // A' 각도 단일 호 (A와 같은 각도 표시)
                {
                    const ap2b = Math.atan2(By - Apy, Bx - Apx);
                    const ap2c = Math.atan2(Cy - Apy, Cx - Apx);
                    let arcS = Math.min(ap2b, ap2c), arcE = Math.max(ap2b, ap2c);
                    if (arcE - arcS > Math.PI) { const tmp = arcS; arcS = arcE; arcE = tmp + Math.PI * 2; }
                    ctx.beginPath();
                    ctx.arc(Apx, Apy, 20, arcS, arcE);
                    ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2; ctx.stroke();
                }

                // C에서 직각 표시
                const len = 15;
                const vx1 = (Bx - Cx) / Math.hypot(Bx - Cx, By - Cy);
                const vy1 = (By - Cy) / Math.hypot(Bx - Cx, By - Cy);
                const vx2 = (Apx - Cx) / Math.hypot(Apx - Cx, Apy - Cy);
                const vy2 = (Apy - Cy) / Math.hypot(Apx - Cx, Apy - Cy);
                ctx.beginPath();
                ctx.moveTo(Cx + vx1 * len, Cy + vy1 * len);
                ctx.lineTo(Cx + vx1 * len + vx2 * len, Cy + vy1 * len + vy2 * len);
                ctx.lineTo(Cx + vx2 * len, Cy + vy2 * len);
                ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 1.5; ctx.stroke();
            }
        }

        // Draw triangle ABC
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Bx, By);
        ctx.lineTo(Cx, Cy);
        ctx.closePath();
        ctx.strokeStyle = '#3182ce';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Labels A, B, C
        drawPoint(Ax, Ay, '#3182ce', 6, '#ffffff');
        ctx.font = 'bold 18px Outfit';
        ctx.fillStyle = '#3182ce';
        ctx.textAlign = 'center';
        ctx.fillText('A', Ax, Ay - 15);
        // 각도 A 단일 호
        {
            const a2b = Math.atan2(By - Ay, Bx - Ax);
            const a2c = Math.atan2(Cy - Ay, Cx - Ax);
            let arcS = Math.min(a2b, a2c), arcE = Math.max(a2b, a2c);
            if (arcE - arcS > Math.PI) { const tmp = arcS; arcS = arcE; arcE = tmp + Math.PI * 2; }
            ctx.beginPath();
            ctx.arc(Ax, Ay, 20, arcS, arcE);
            ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 2; ctx.stroke();
        }

        drawPoint(Bx, By, '#3182ce', 6, '#ffffff');
        ctx.font = 'bold 18px Outfit';
        ctx.fillStyle = '#3182ce';
        ctx.textAlign = 'right';
        ctx.fillText('B', Bx - 12, By + 20);

        drawPoint(Cx, Cy, '#3182ce', 6, '#ffffff');
        ctx.font = 'bold 18px Outfit';
        ctx.fillStyle = '#3182ce';
        ctx.textAlign = 'left';
        ctx.fillText('C', Cx + 12, Cy + 20);

        // Label 'a' on BC
        ctx.fillStyle = '#2d3748';
        ctx.textAlign = 'center';
        ctx.font = 'italic bold 18px Outfit';
        ctx.fillText('a', cx, By + 22);

        // Label R
        if (!sineLawProofMode) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(Ax, Ay);
            ctx.strokeStyle = 'rgba(74, 85, 104, 0.4)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#4a5568';
            ctx.font = 'italic bold 16px Outfit';
            ctx.fillText('R', cx + (Ax - cx) / 2 + 15, cy + (Ay - cy) / 2);
        } else {
            // Label 2R on BA'
            const Apx = cx + R * Math.cos(bAngle - Math.PI);
            const Apy = cy + R * Math.sin(bAngle - Math.PI);
            ctx.fillStyle = '#e53e3e';
            ctx.font = 'italic bold 16px Outfit';
            ctx.fillText('2R', cx - 10, cy - 15);
        }

        updateSineLawInfo();
    }

    function updateSineLawInfo() {
        const infoEl = document.getElementById('sineLawInfo');
        if (!infoEl) return;

        const A = sineLawAngleA;
        const showProof = sineLawProofMode;

        let html = '';

        if (!showProof) {
            html = `<span style="color:#718096; font-size:15px;">증명선(지름 BA')을 켜서 확인해보세요!</span><br/>`;
            html += `<span style="font-size:22px; color:#3182ce;">$\\frac{a}{\\sin A} = 2R$</span>`;
        } else {
            if (A < 90) {
                html = `<div style="color:#e53e3e; margin-bottom:8px;">[ $\\angle A < 90^\\circ$ 일 때 (예각) ]</div>`;
                html += `점 B에서 중심 O를 지나는 지름 BA'을 그으면<br/>`;
                html += `$\\angle A = \\angle A'$ 이고, $\\angle A'CB = 90^\\circ$ 이므로<br/>`;
                html += `<span style="font-size:20px; display:inline-block; margin-top:8px; color:#2b6cb0;">$\\sin A = \\sin A' = \\frac{a}{2R}$</span>`;
            } else if (A === 90) {
                html = `<div style="color:#38a169; margin-bottom:8px;">[ $\\angle A = 90^\\circ$ 일 때 (직각) ]</div>`;
                html += `지름이 BC 이므로 $a = 2R$ 이고,<br/>`;
                html += `$\\sin A = \\sin 90^\\circ = 1$ 이므로<br/>`;
                html += `<span style="font-size:20px; display:inline-block; margin-top:8px; color:#2b6cb0;">$\\sin A = \\frac{a}{2R} = 1$</span>`;
            } else {
                html = `<div style="color:#3182ce; margin-bottom:8px;">[ $\\angle A > 90^\\circ$ 일 때 (둔각) ]</div>`;
                html += `점 B에서 중심 O를 지나는 지름 BA'을 그으면<br/>`;
                html += `내접사각형 성질에 의해 $\\angle A = 180^\\circ - \\angle A'$ 이고, $\\angle A'CB = 90^\\circ$ 이므로<br/>`;
                html += `<span style="font-size:20px; display:inline-block; margin-top:8px; color:#2b6cb0;">$\\sin A = \\sin(180^\\circ - A') = \\sin A' = \\frac{a}{2R}$</span>`;
            }
        }

        if (window.katex) {
            html = html
                .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
                    try { return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: true }); }
                    catch (e) { return _; }
                })
                .replace(/\$([^$\n]+?)\$/g, (_, expr) => {
                    try { return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: false }); }
                    catch (e) { return _; }
                });
        }
        infoEl.innerHTML = html;
    }

    /* =====================================================
       코사인법칙 시각화
       삼각형 ABC에서 ∠C 조절, 수선의 발 H 표시
       c² = a² + b² - 2ab·cosC 증명 (3케이스)
    ===================================================== */
    function drawCosineLaw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const SCALE = 62;
        const a = cosineLawSideA;   // BC = a
        const b = cosineLawSideB;   // CA = b
        const C = cosineLawAngleC * Math.PI / 180;

        // c² = a² + b² - 2ab·cosC
        const c2 = a * a + b * b - 2 * a * b * Math.cos(C);
        const c = Math.sqrt(Math.max(c2, 0));

        // ── 좌표 배치 (각도 C가 꼭짓점 C에서의 내각) ──
        // B = (0, 0),  C = (a, 0)
        // A = C + b·(C→A 방향)
        //   C→B 방향각 = π,  C→A는 C→B에서 C° 만큼 회전(반시계)
        //   → A = (a, 0) + b·(cos(π-C), sin(π-C)) = (a - b·cosC, b·sinC)
        const Bx_raw = 0;
        const Cx_raw = a;
        const Ax_raw = a - b * Math.cos(C);   // ← 수정: 꼭짓점 C 기준
        const Ay_raw = b * Math.sin(C);

        // H = A에서 BC(x축)에 내린 수선의 발 → H_x = Ax_raw
        const Hx_raw = Ax_raw;  // = a - b·cosC

        // bounding box (H 포함)
        const minX = Math.min(0, Bx_raw, Cx_raw, Ax_raw, Hx_raw);
        const maxX = Math.max(Bx_raw, Cx_raw, Ax_raw, Hx_raw);
        const minY = 0;
        const maxY = Ay_raw;

        const triW = (maxX - minX) * SCALE;
        const triH = (maxY - minY) * SCALE;
        const offX = (W - triW) / 2 - minX * SCALE;
        const offY = (H - triH) / 2 - minY * SCALE + triH * 0.15;

        const toScreen = (rx, ry) => [offX + rx * SCALE, offY + (maxY - ry) * SCALE];

        const [Bx, By]   = toScreen(Bx_raw, 0);
        const [Cx, Cy2]  = toScreen(Cx_raw, 0);
        const [Ax, Ay]   = toScreen(Ax_raw, Ay_raw);
        const [Hx, Hy]   = toScreen(Hx_raw, 0);

        const isAcute  = cosineLawAngleC < 89.5;
        const isRight  = cosineLawAngleC >= 89.5 && cosineLawAngleC <= 90.5;
        const isObtuse = cosineLawAngleC > 90.5;

        // ── 삼각형 면 채우기 ──
        ctx.beginPath();
        ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By); ctx.lineTo(Cx, Cy2); ctx.closePath();
        ctx.fillStyle = 'rgba(99,179,237,0.10)';
        ctx.fill();

        // ── 수선 및 보조선 ──
        if (cosineLawShowProof) {
            // A → H 수선 (점선)
            ctx.save();
            ctx.strokeStyle = '#805ad5'; ctx.lineWidth = 1.8;
            ctx.setLineDash([6, 4]);
            ctx.beginPath(); ctx.moveTo(Ax, Ay); ctx.lineTo(Hx, Hy); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // 직각 마크 at H
            if (!isRight) {
                const sq = 10;
                ctx.save(); ctx.strokeStyle = '#805ad5'; ctx.lineWidth = 1.5;
                // H에서: BC방향(+x), A방향(-y in screen)
                // 예각: H는 BC 사이 → 마크를 C 방향(+x)
                // 둔각: H는 C 오른쪽 → 마크를 B 방향(-x)
                const hd = isAcute ? sq : -sq;
                ctx.beginPath();
                ctx.moveTo(Hx + hd, Hy);
                ctx.lineTo(Hx + hd, Hy - sq);
                ctx.lineTo(Hx, Hy - sq);
                ctx.stroke();
                ctx.restore();
            }

            // 둔각: C 오른쪽으로 연장선 (BC의 연장)
            if (isObtuse) {
                ctx.save();
                ctx.strokeStyle = 'rgba(128,90,213,0.4)'; ctx.lineWidth = 1.8;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(Cx, Cy2);       // C에서 오른쪽으로
                ctx.lineTo(Hx + 20, Hy);   // H를 지나서
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }

        // ── 삼각형 변 ──
        ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(Bx, By); ctx.lineTo(Cx, Cy2); ctx.stroke();   // a
        ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(Cx, Cy2); ctx.lineTo(Ax, Ay); ctx.stroke();   // b
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By); ctx.stroke();    // c

        // ── 꼭짓점 점 ──
        const drawDot = (x, y, color) => {
            ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.fill();
            ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
        };
        drawDot(Bx, By, '#e53e3e');
        drawDot(Cx, Cy2, '#38a169');
        drawDot(Ax, Ay, '#d97706');
        if (cosineLawShowProof && !isRight) drawDot(Hx, Hy, '#805ad5');

        // ── 꼭짓점 레이블 ──
        ctx.font = 'bold 20px Outfit';
        ctx.fillStyle = '#d97706'; ctx.textAlign = 'center';
        ctx.fillText('A', Ax, Ay - 18);
        ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'right';
        ctx.fillText('B', Bx - 14, By + 8);
        ctx.fillStyle = '#38a169'; ctx.textAlign = 'left';
        ctx.fillText('C', Cx + 14, Cy2 + 8);
        if (cosineLawShowProof && !isRight) {
            ctx.fillStyle = '#805ad5'; ctx.textAlign = 'center';
            // 예각: H는 B~C 사이 / 둔각: H는 C 오른쪽
            ctx.fillText('H', Hx, Hy + 22);
        }

        // ── 변 길이 레이블 ──
        ctx.font = 'italic bold 18px Outfit';
        ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'center';
        ctx.fillText('a = ' + a.toFixed(1), (Bx + Cx) / 2, By + 28);   // a on BC (아래)
        const bmx = (Cx + Ax) / 2, bmy = (Cy2 + Ay) / 2;
        ctx.fillStyle = '#3182ce';
        // A가 C 왼쪽이면 b 레이블을 오른쪽에, 오른쪽이면 왼쪽에
        ctx.textAlign = Ax_raw < Cx_raw ? 'right' : 'left';
        ctx.fillText('b = ' + b.toFixed(1), bmx + (Ax_raw < Cx_raw ? -12 : 12), bmy);
        const cmx = (Ax + Bx) / 2, cmy = (Ay + By) / 2;
        ctx.fillStyle = '#d97706'; ctx.textAlign = 'left';
        ctx.fillText('c = ' + c.toFixed(2), cmx - 60, cmy);

        // ── 각도 C 호 표시 ──
        {
            const dirCB = Math.atan2(By - Cy2, Bx - Cx);   // C→B 방향각
            const dirCA = Math.atan2(Ay - Cy2, Ax - Cx);   // C→A 방향각

            // dirCB(왼쪽=π) → dirCA(상단 왼쪽) 시계방향으로 그리면 내각(작은 호)
            ctx.beginPath();
            ctx.arc(Cx, Cy2, 28, dirCB, dirCA, false);
            ctx.strokeStyle = '#38a169'; ctx.lineWidth = 2.5; ctx.stroke();

            // 레이블: 호 중간 방향
            let diffCW = dirCA - dirCB;
            while (diffCW <= 0) diffCW += Math.PI * 2;
            const midAng = dirCB + diffCW / 2;
            ctx.fillStyle = '#38a169'; ctx.font = 'bold 14px Outfit'; ctx.textAlign = 'center';
            ctx.fillText(cosineLawAngleC + '°', Cx + 50 * Math.cos(midAng), Cy2 + 50 * Math.sin(midAng));
        }

        // ── 수선 보조 레이블 (BH, AH) ──
        if (cosineLawShowProof && !isRight) {
            const AH_len = Ay_raw;   // = b·sinC
            ctx.font = '13px Outfit'; ctx.fillStyle = '#805ad5';
            ctx.textAlign = 'center';
            if (isAcute) {
                // H가 B~C 사이
                ctx.fillText('BH = a – b·cosC', (Bx + Hx) / 2, By - 14);
                ctx.fillStyle = 'rgba(128,90,213,0.7)';
                ctx.fillText('CH = b·cosC', (Hx + Cx) / 2, By - 14);
            } else {
                // H가 C 오른쪽 (둔각)
                ctx.fillText('BH = a – b·cosC', (Bx + Cx) / 2, By - 14);  // B~C 전체 구간 위
                ctx.fillStyle = 'rgba(128,90,213,0.7)';
                ctx.fillText('CH = –b·cosC', (Cx + Hx) / 2, Cy2 + 36);    // C~H 구간 아래
            }
            ctx.fillStyle = '#553c9a'; ctx.textAlign = 'right';
            ctx.fillText('AH = b·sinC = ' + AH_len.toFixed(2), Hx - 8, (Ay + Hy) / 2);
        }

        // ── 케이스 배지 ──
        let caseTxt, caseColor, caseBg;
        if (isAcute)       { caseTxt = '① C < 90° (예각)'; caseColor = '#2b6cb0'; caseBg = 'rgba(235,248,255,0.95)'; }
        else if (isRight)  { caseTxt = '② C = 90° (직각)'; caseColor = '#276749'; caseBg = 'rgba(240,255,244,0.95)'; }
        else               { caseTxt = '③ C > 90° (둔각)'; caseColor = '#c05621'; caseBg = 'rgba(255,250,240,0.95)'; }
        const badgeW = 190, badgeH = 32, badgeX = W - badgeW - 16, badgeY = 16;
        ctx.fillStyle = caseBg;
        ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10); ctx.fill();
        ctx.strokeStyle = caseColor; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10); ctx.stroke();
        ctx.fillStyle = caseColor; ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'center';
        ctx.fillText(caseTxt, badgeX + badgeW / 2, badgeY + 21);

        updateCosineLawInfo(a, b, c, c2);
    }

    function updateCosineLawInfo(a, b, c, c2_actual) {
        const infoEl = document.getElementById('cosineLawInfo');
        if (!infoEl) return;

        const C = cosineLawAngleC;
        const Crad = C * Math.PI / 180;
        const isAcute  = C < 89.5;
        const isRight  = C >= 89.5 && C <= 90.5;
        const isObtuse = C > 90.5;

        const lhs = c2_actual;
        const rhs = a * a + b * b - 2 * a * b * Math.cos(Crad);

        let caseHtml = '';
        if (isAcute) {
            caseHtml = `
                <div style="color:#2b6cb0;font-size:14px;margin-bottom:4px;">꼭짓점 A에서 BC에 내린 수선의 발을 H라 하면</div>
                <div style="color:#553c9a;font-size:13px;">
                    BH = BC − CH = <b>a − b·cos C</b>,&nbsp; AH = <b>b·sin C</b>
                </div>`;
        } else if (isRight) {
            caseHtml = `
                <div style="color:#276749;font-size:14px;margin-bottom:4px;">cos C = cos 90° = 0 이므로</div>
                <div style="color:#276749;font-size:13px;">c² = a² + b² (피타고라스 정리와 일치)</div>`;
        } else {
            caseHtml = `
                <div style="color:#c05621;font-size:14px;margin-bottom:4px;">꼭짓점 A에서 BC의 연장선에 내린 수선의 발을 H라 하면</div>
                <div style="color:#553c9a;font-size:13px;">
                    BH = BC + CH = <b>a − b·cos C</b>,&nbsp; AH = <b>b·sin(180°−C)</b>
                </div>`;
        }

        let html = caseHtml;
        html += `<div style="margin:8px 0; border-top:1px solid #e2e8f0;"></div>`;
        html += `<div style="font-size:17px; color:#2d3748;">`;
        html += `c² = BH² + AH² = (a − b·cos C)² + (b·sin C)²`;
        html += `</div><div style="font-size:17px; color:#2d3748; margin-top:2px;">`;
        html += `= a² + b² − 2ab·cos C`;
        html += `</div>`;
        html += `<div style="margin:8px 0; border-top:1px solid #e2e8f0;"></div>`;
        html += `<div style="font-size:15px; display:flex; gap:24px; justify-content:center; flex-wrap:wrap;">`;
        html += `<span>c² = <b style="color:#d97706;">${lhs.toFixed(3)}</b></span>`;
        html += `<span>a² + b² − 2ab·cos C = <b style="color:#38a169;">${rhs.toFixed(3)}</b></span>`;
        html += `<span style="color:#2b6cb0; font-weight:900;">✓ ${Math.abs(lhs - rhs) < 0.001 ? '일치' : '오차: ' + Math.abs(lhs - rhs).toFixed(4)}</span>`;
        html += `</div>`;

        infoEl.innerHTML = html;
    }

    window.initTrig = initTrig;
    window.drawTrig = drawTrig;
})();