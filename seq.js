/* ========================================================= */
/* --- seq.js : 시그마(Σ) 거듭제곱의 합 퍼즐 시각화     --- */
/* ========================================================= */

window.initSeq = (function () {
    let _initialized = false;

    return function () {
        if (_initialized) return;
        _initialized = true;

        /* ============================================================
           0. 공통 팔레트 & 헬퍼
        ============================================================ */
        const PALETTE = [
            '#ffb3c6', '#a8d8ea', '#b5ead7', '#ffd6a5',
            '#c9b1ff', '#caffbf', '#fdffb6', '#9bf6ff',
            '#ffadad', '#bde0fe', '#d4f1f4', '#fce1e4',
            '#dfe7fd', '#e8f5e9', '#fff9c4', '#f3e5f5',
            '#e0f7fa', '#fce4ec', '#f1f8e9', '#fff3e0',
        ];

        const DARK_PALETTE = PALETTE.map(c => {
            // 파스텔 → 테두리용 약간 어두운 색
            const r = parseInt(c.slice(1, 3), 16);
            const g = parseInt(c.slice(3, 5), 16);
            const b = parseInt(c.slice(5, 7), 16);
            return `rgb(${Math.max(0, r - 55)},${Math.max(0, g - 55)},${Math.max(0, b - 55)})`;
        });

        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${alpha})`;
        }

        /* ============================================================
           1. 탭 전환 로직
        ============================================================ */
        const panels = {
            sum1: document.getElementById('seq-panel-sum1'),
            sum2: document.getElementById('seq-panel-sum2'),
            sum3: document.getElementById('seq-panel-sum3'),
        };

        function switchPanel(tab) {
            Object.values(panels).forEach(p => { if (p) p.classList.remove('active'); });
            if (panels[tab]) panels[tab].classList.add('active');

            // 좌측 idx-seq 탭 active 동기화
            document.querySelectorAll('#idx-seq .index-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.seqtab === tab);
            });

            // 현재 탭 렌더 트리거
            if (tab === 'sum1') drawSum1();
            if (tab === 'sum2') drawSum2();
            if (tab === 'sum3') drawSum3();
        }

        // idx-seq 탭 연결
        document.querySelectorAll('#idx-seq .index-tab').forEach(tab => {
            tab.addEventListener('click', () => switchPanel(tab.dataset.seqtab));
        });

        // main.js에서 탭 전환 시 호출 가능하도록 전역 노출
        window.seqSwitchPanel = switchPanel;

        /* ============================================================
           2. KaTeX 수식 렌더링
        ============================================================ */
        function renderKatex(selector, latex) {
            const el = document.querySelector(selector);
            if (!el || !window.katex) return;
            katex.render(latex, el, { throwOnError: false, displayMode: true });
        }

        renderKatex('#seq-formula-sum1',
            '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}');
        renderKatex('#seq-formula-sum2',
            '\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}');
        renderKatex('#seq-formula-sum3',
            '\\sum_{k=1}^{n} k^3 = \\left(\\frac{n(n+1)}{2}\\right)^2');

        /* ============================================================
           3. TAB 1 — 자연수의 합 (Σk) : 계단탑 + 뒤집기 애니메이션
        ============================================================ */
        const canvas1 = document.getElementById('seq-canvas-sum1');
        const ctx1 = canvas1 ? canvas1.getContext('2d') : null;
        const slider1 = document.getElementById('seq-slider-sum1');
        const nVal1 = document.getElementById('seq-n-val-sum1');
        const runBtn1 = document.getElementById('seq-run-btn-sum1');
        const fb1 = document.getElementById('seq-feedback-sum1');

        let n1 = 5;            // 현재 n
        let anim1Id = null;    // 애니메이션 ID
        let anim1Running = false;

        function getBlockSize1(n) {
            if (!canvas1) return 30;
            // 완성 직사각형: (n+1)열 × n행
            return Math.min(Math.floor((canvas1.width - 80) / (n + 1)), 40);
        }

        function drawSum1(animOffset) {
            if (!ctx1) return;
            const n = n1;
            const W = canvas1.width, H = canvas1.height;
            const bs = getBlockSize1(n);

            // 완성 직사각형 기준: n행 × (n+1)열
            const gridW = (n + 1) * bs;
            const gridH = n * bs;
            const ox = Math.floor((W - gridW) / 2);
            const oy = Math.floor((H - gridH) / 2);

            ctx1.clearRect(0, 0, W, H);

            // 배경 격자
            ctx1.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx1.lineWidth = 0.5;
            for (let r = 0; r <= n; r++) {
                ctx1.beginPath();
                ctx1.moveTo(ox, oy + r * bs);
                ctx1.lineTo(ox + (n + 1) * bs, oy + r * bs);
                ctx1.stroke();
            }
            for (let c = 0; c <= n + 1; c++) {
                ctx1.beginPath();
                ctx1.moveTo(ox + c * bs, oy);
                ctx1.lineTo(ox + c * bs, oy + n * bs);
                ctx1.stroke();
            }

            /* --- 원래 계단탑: row k-1에 k개 블록 (왼쪽 정렬)
               k=1 → row 0 (맨 위), k=n → row n-1 (맨 아래) */
            for (let k = 1; k <= n; k++) {
                const row = k - 1;  // ← 핵심: 1부터 위에서 아래로
                const color = PALETTE[(k - 1) % PALETTE.length];
                const dark = DARK_PALETTE[(k - 1) % DARK_PALETTE.length];
                for (let col = 0; col < k; col++) {
                    const x = ox + col * bs;
                    const y = oy + row * bs;
                    ctx1.fillStyle = color;
                    ctx1.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                    ctx1.strokeStyle = dark;
                    ctx1.lineWidth = 1.5;
                    ctx1.strokeRect(x + 1, y + 1, bs - 2, bs - 2);

                    if (bs >= 20) {
                        ctx1.fillStyle = 'rgba(0,0,0,0.45)';
                        ctx1.font = `bold ${Math.min(bs * 0.38, 13)}px Outfit, sans-serif`;
                        ctx1.textAlign = 'center';
                        ctx1.textBaseline = 'middle';
                        ctx1.fillText(k, x + bs / 2, y + bs / 2);
                    }
                }
            }

            /* --- 뒤집힌 반투명 계단탑 ---
               뒤집힌 탑: row k-1에 (n+1-k)개 블록, 원래 탑 오른쪽에 이어붙임
               합쳐서 각 행 → (n+1)개 블록 → n×(n+1) 직사각형
               animOffset > 0 : 위에서 내려오는 중 (y 좌표를 -offset만큼 올림)
               animOffset = 0 : 완성 위치
               animOffset = undefined : 숨김
            */
            if (animOffset !== undefined) {
                const alpha = animOffset === 0 ? 0.75 : 0.55;
                for (let k = 1; k <= n; k++) {
                    const row = k - 1;
                    // 색상 반전: 원래 탑의 row k-1 = PALETTE[k-1]
                    // 뒤집힌 탑의 row k-1 = PALETTE[n-k] (반대 방향)
                    const color = PALETTE[(n - k) % PALETTE.length];
                    const dark = DARK_PALETTE[(n - k) % DARK_PALETTE.length];
                    // 원래 탑이 col 0..k-1 이므로, 뒤집힌 탑은 col k..n
                    for (let col = k; col <= n; col++) {
                        const x = ox + col * bs;
                        const y = oy + row * bs - animOffset;
                        ctx1.fillStyle = hexToRgba(color, alpha);
                        ctx1.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                        ctx1.strokeStyle = dark;
                        ctx1.lineWidth = 1;
                        ctx1.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    }
                }
            }

            // 완성 시 치수 표시
            if (animOffset === 0) {
                ctx1.strokeStyle = '#e53e3e';
                ctx1.lineWidth = 3;
                ctx1.setLineDash([6, 3]);
                ctx1.strokeRect(ox, oy, (n + 1) * bs, n * bs);
                ctx1.setLineDash([]);

                ctx1.fillStyle = '#e53e3e';
                ctx1.font = `bold ${Math.min(bs * 0.5, 16)}px Outfit, sans-serif`;
                ctx1.textAlign = 'center';
                ctx1.textBaseline = 'bottom';
                ctx1.fillText(`n+1 = ${n + 1}`, ox + (n + 1) * bs / 2, oy - 6);
                ctx1.textAlign = 'right';
                ctx1.textBaseline = 'middle';
                ctx1.fillText(`n = ${n}`, ox - 6, oy + n * bs / 2);
            }
        }

        function animateSum1() {
            if (!ctx1 || anim1Running) return;
            anim1Running = true;
            if (runBtn1) runBtn1.disabled = true;
            if (fb1) fb1.style.opacity = '0';

            const n = n1;
            const bs = getBlockSize1(n);
            const totalDrop = (n + 1) * bs; // 시작 위치: 맨 위에서 아래로
            let offset = totalDrop;
            const speed = Math.max(3, totalDrop / 50);

            function step() {
                offset -= speed;
                if (offset <= 0) {
                    offset = 0;
                    drawSum1(0);
                    // 피드백
                    if (fb1) {
                        const sum = n * (n + 1) / 2;
                        fb1.innerHTML = `
                          <span class="seq-fb-big">총 넓이 = n × (n+1) = ${n} × ${n + 1} = ${n * (n + 1)}</span><br>
                          <span class="seq-fb-sub">따라서 원래 구하려던 합은 절반인</span>
                          <span class="seq-fb-formula"> ${n}(${n + 1}) ÷ 2 = <strong>${sum}</strong></span>`;
                        fb1.classList.add('show');
                        fb1.style.opacity = '1';
                    }
                    anim1Running = false;
                    if (runBtn1) runBtn1.disabled = false;
                    return;
                }
                drawSum1(offset);
                anim1Id = requestAnimationFrame(step);
            }
            anim1Id = requestAnimationFrame(step);
        }

        if (slider1) {
            slider1.addEventListener('input', () => {
                n1 = parseInt(slider1.value);
                if (nVal1) nVal1.textContent = n1;
                if (anim1Running) { cancelAnimationFrame(anim1Id); anim1Running = false; }
                if (fb1) { fb1.classList.remove('show'); fb1.style.opacity = '0'; }
                if (runBtn1) runBtn1.disabled = false;
                drawSum1();
            });
        }
        if (runBtn1) runBtn1.addEventListener('click', animateSum1);

        const reset1 = document.getElementById('seq-reset-btn-sum1');
        if (reset1) {
            reset1.addEventListener('click', () => {
                if (anim1Running) { cancelAnimationFrame(anim1Id); anim1Running = false; }
                if (fb1) { fb1.classList.remove('show'); fb1.style.opacity = '0'; }
                if (runBtn1) runBtn1.disabled = false;
                drawSum1();
            });
        }

        /* ============================================================
           4. TAB 2 — 제곱의 합 (Σk²) : 계단 피라미드 × 6 = 직육면체 증명
           (유튜브 '자연수의 거듭제곱의 합 직관적 이해-3D' 방식)
        ============================================================ */
        const canvas2 = document.getElementById('seq-canvas-sum2');
        const ctx2 = canvas2 ? canvas2.getContext('2d') : null;
        const slider2 = document.getElementById('seq-slider-sum2');
        const nVal2 = document.getElementById('seq-n-val-sum2');
        const fb2 = document.getElementById('seq-feedback-sum2');

        let n2 = 4;
        let colProgress2 = new Array(20).fill(0);
        let anim2Id = null;
        for (let i = 0; i < n2; i++) colProgress2[i] = 1;

        function dropColumn2(k) {
            const idx = k - 1;
            colProgress2[idx] = 0;
            if (anim2Id) cancelAnimationFrame(anim2Id);
            const start = performance.now();
            const dur = 450;
            function step(now) {
                const t = Math.min(1, (now - start) / dur);
                const p = 1 - Math.pow(1 - t, 3);
                colProgress2[idx] = p;
                drawSum2();
                if (t < 1) anim2Id = requestAnimationFrame(step);
            }
            anim2Id = requestAnimationFrame(step);
        }

        function drawSum2() {
            if (!ctx2 || !canvas2) return;
            const n = n2;
            const W = canvas2.width, H = canvas2.height;
            ctx2.clearRect(0, 0, W, H);
            const PAD = 20;
            const splitX = Math.floor(W * 0.48);

            /* ── 왼쪽: 계단형 피라미드 ── */
            const leftW = splitX - PAD;
            const leftH = H - PAD * 2 - 22;
            const totalCells = n * (n + 1) / 2;
            const gap = Math.max(2, Math.floor(leftW * 0.015));
            const U = Math.max(4, Math.min(
                Math.floor((leftW - gap * (n - 1)) / totalCells),
                Math.floor(leftH / n),
                40
            ));
            const pyramidW = totalCells * U + gap * (n - 1);
            let px = PAD + Math.floor((leftW - pyramidW) / 2);
            const baseY = PAD + leftH;

            ctx2.fillStyle = '#2d3748';
            ctx2.font = 'bold 13px Outfit, sans-serif';
            ctx2.textAlign = 'center';
            ctx2.textBaseline = 'bottom';
            ctx2.fillText('계단형 피라미드 (Σk²)', PAD + leftW / 2, PAD - 2);

            const visSum = [...Array(n)].reduce((a, _, i) => a + (colProgress2[i] > 0.5 ? (i + 1) ** 2 : 0), 0);
            ctx2.fillStyle = '#e53e3e';
            ctx2.font = 'bold 12px Outfit, sans-serif';
            ctx2.textAlign = 'center';
            ctx2.textBaseline = 'top';
            ctx2.fillText(`= ${visSum}`, PAD + leftW / 2, PAD + 1);

            for (let k = 1; k <= n; k++) {
                const prog = Math.max(0, colProgress2[k - 1]);
                const color = PALETTE[(k - 1) % PALETTE.length];
                const dark = DARK_PALETTE[(k - 1) % DARK_PALETTE.length];
                const colW = k * U;
                const cells = Math.floor(k * prog);
                if (prog > 0.01) {
                    for (let row = 0; row < cells; row++) {
                        for (let col = 0; col < k; col++) {
                            ctx2.fillStyle = color;
                            ctx2.fillRect(px + col * U + 0.5, baseY - (row + 1) * U + 0.5, U - 1, U - 1);
                        }
                    }
                    ctx2.strokeStyle = hexToRgba(dark, 0.35);
                    ctx2.lineWidth = 0.6;
                    for (let row = 0; row <= cells; row++) {
                        ctx2.beginPath(); ctx2.moveTo(px, baseY - row * U); ctx2.lineTo(px + colW, baseY - row * U); ctx2.stroke();
                    }
                    for (let col = 0; col <= k; col++) {
                        ctx2.beginPath(); ctx2.moveTo(px + col * U, baseY - cells * U); ctx2.lineTo(px + col * U, baseY); ctx2.stroke();
                    }
                    ctx2.strokeStyle = dark; ctx2.lineWidth = 1.5;
                    ctx2.strokeRect(px + 0.5, baseY - cells * U + 0.5, colW - 1, cells * U - 1);
                    if (prog > 0.85 && U >= 10) {
                        ctx2.fillStyle = '#2d3748';
                        ctx2.font = `bold ${Math.min(U * 0.6, 12)}px Outfit, sans-serif`;
                        ctx2.textAlign = 'center'; ctx2.textBaseline = 'top';
                        ctx2.fillText(`${k}²`, px + colW / 2, baseY + 3);
                    }
                }
                px += colW + gap;
            }

            /* ── 오른쪽: (2n+1)행 × (n+1)열 3색 직사각형 ── */
            const rightX = splitX + PAD;
            const rightW = W - rightX - PAD;
            const rightH = H - PAD * 2 - 30;
            const rows = 2 * n + 1, cols = n + 1;
            const cellU = Math.max(4, Math.min(
                Math.floor(rightW / cols),
                Math.floor(rightH / rows),
                36
            ));
            const gridW = cols * cellU, gridH = rows * cellU;
            const gX = rightX + Math.floor((rightW - gridW) / 2);
            const gY = PAD + Math.floor((rightH - gridH) / 2) + 14;

            const CA = '#ffb3c6', CB = '#a8d8ea', CC = '#b5ead7';
            const DA = '#d4607a', DB = '#5b9bb5', DC = '#5fad8a';

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    let fill, stroke;
                    if (r < n) { fill = c < r + 1 ? CA : CB; stroke = c < r + 1 ? DA : DB; }
                    else if (r === n) { fill = CC; stroke = DC; }
                    else { const lc = 2 * n - r + 1; fill = c < lc ? CB : CA; stroke = c < lc ? DB : DA; }
                    ctx2.fillStyle = fill;
                    ctx2.fillRect(gX + c * cellU + 0.5, gY + r * cellU + 0.5, cellU - 1, cellU - 1);
                    ctx2.strokeStyle = hexToRgba(stroke, 0.5); ctx2.lineWidth = 0.6;
                    ctx2.strokeRect(gX + c * cellU + 0.5, gY + r * cellU + 0.5, cellU - 1, cellU - 1);
                }
            }
            ctx2.strokeStyle = '#2d3748'; ctx2.lineWidth = 2;
            ctx2.strokeRect(gX, gY, gridW, gridH);
            ctx2.strokeStyle = '#4a5568'; ctx2.lineWidth = 1.5;
            [n, n + 1].forEach(r => {
                ctx2.beginPath(); ctx2.moveTo(gX, gY + r * cellU); ctx2.lineTo(gX + gridW, gY + r * cellU); ctx2.stroke();
            });

            const lsz = Math.min(cellU * 0.65, 11);
            ctx2.fillStyle = '#2b6cb0'; ctx2.font = `bold ${lsz}px Outfit, sans-serif`;
            ctx2.textAlign = 'center'; ctx2.textBaseline = 'bottom';
            ctx2.fillText(`n+1 = ${n + 1}`, gX + gridW / 2, gY - 2);
            ctx2.save(); ctx2.translate(gX - 4, gY + gridH / 2); ctx2.rotate(-Math.PI / 2);
            ctx2.textAlign = 'center'; ctx2.textBaseline = 'bottom';
            ctx2.fillText(`2n+1 = ${2 * n + 1}`, 0, 0); ctx2.restore();

            // 범례
            const legY = gY + gridH + 5, legH2 = H - legY - 4;
            if (legH2 > 10) {
                [{ c: CA, t: '핑크 쌍 (×2)' }, { c: CB, t: '하늘 쌍 (×2)' }, { c: CC, t: '민트 (×2)' }].forEach((item, i) => {
                    const lx = gX + i * 82;
                    ctx2.fillStyle = item.c; ctx2.fillRect(lx, legY, 10, 10);
                    ctx2.strokeStyle = '#718096'; ctx2.lineWidth = 0.8; ctx2.strokeRect(lx, legY, 10, 10);
                    ctx2.fillStyle = '#4a5568'; ctx2.font = `${Math.min(legH2 * 0.75, 10)}px Outfit, sans-serif`;
                    ctx2.textAlign = 'left'; ctx2.textBaseline = 'middle';
                    ctx2.fillText(item.t, lx + 13, legY + 5);
                });
            }

            ctx2.fillStyle = '#2d3748'; ctx2.font = 'bold 12px Outfit, sans-serif';
            ctx2.textAlign = 'center'; ctx2.textBaseline = 'bottom';
            ctx2.fillText('피라미드 × 6 = 직육면체', rightX + rightW / 2, PAD - 1);

            const sum = n * (n + 1) * (2 * n + 1) / 6;
            const eqX = gX + gridW + 7;
            let ey = gY;
            [{ t: '6 × Σk²', c: '#2d3748', b: true, s: 11 }, { t: `= n(n+1)(2n+1)`, c: '#4a5568', b: false, s: 10 },
            { t: `= ${n}·${n + 1}·${2 * n + 1}`, c: '#e53e3e', b: true, s: 10 }, { t: `= ${6 * sum}`, c: '#e53e3e', b: true, s: 11 },
            { t: '', c: '', b: false, s: 6 }, { t: `∴ Σk²`, c: '#2d3748', b: true, s: 11 }, { t: `= ${sum}`, c: '#e53e3e', b: true, s: 14 }
            ].forEach(el => {
                if (!el.t) { ey += el.s; return; }
                ctx2.fillStyle = el.c; ctx2.font = `${el.b ? 'bold' : ''} ${el.s}px Outfit, sans-serif`;
                ctx2.textAlign = 'left'; ctx2.textBaseline = 'top';
                ctx2.fillText(el.t, eqX, ey, W - eqX - 4); ey += el.s + 4;
            });

            if (fb2) {
                fb2.innerHTML = `<span class="seq-fb-big">1² + 2² + ··· + ${n}² = ${sum}</span><br>` +
                    `<span class="seq-fb-sub">피라미드 6개 → ${n}×${n + 1}×${2 * n + 1} = ${6 * sum} → ÷6 = <strong>${sum}</strong></span>`;
                fb2.classList.add('show');
            }
        }

        if (slider2) {
            slider2.addEventListener('input', () => {
                const newN = parseInt(slider2.value);
                if (nVal2) nVal2.textContent = newN;
                const oldN = n2;
                n2 = newN;
                if (newN > oldN) {
                    for (let k = oldN + 1; k <= newN; k++) {
                        const delay = (k - oldN - 1) * 120;
                        setTimeout(() => { if (n2 >= k) dropColumn2(k); }, delay);
                    }
                } else {
                    for (let k = newN + 1; k <= oldN; k++) colProgress2[k - 1] = 0;
                    if (anim2Id) cancelAnimationFrame(anim2Id);
                    drawSum2();
                }
            });
        }

        /* ============================================================
           5. TAB 3 — 세제곱의 합 (Σk³) : ㄱ자 테트리스 퍼즐
        ============================================================ */
        const canvas3 = document.getElementById('seq-canvas-sum3');
        const ctx3 = canvas3 ? canvas3.getContext('2d') : null;
        const slider3 = document.getElementById('seq-slider-sum3');
        const nVal3 = document.getElementById('seq-n-val-sum3');
        const runBtn3 = document.getElementById('seq-run-btn-sum3');
        const fb3 = document.getElementById('seq-feedback-sum3');

        let n3 = 3;
        let anim3Id = null;
        let anim3Running = false;

        // 삼각수: T(n) = 1+2+...+n = n(n+1)/2
        function T(n) { return n * (n + 1) / 2; }

        /**
         * k 번째 껍질(ㄱ자 조각)을 위한 블록 좌표를 반환.
         * 큰 정사각형 T(k) × T(k) 내에서, 이전 T(k-1) × T(k-1) 을 제외한 영역을
         * 세 부분으로 분할:
         *   - 오른쪽 세로 띠: k × T(k-1) 블록 (col = T(k-1)..T(k)-1, row = 0..T(k-1)-1)
         *   - 아래쪽 가로 띠: T(k-1) × k 블록 (row = T(k-1)..T(k)-1, col = 0..T(k-1)-1)
         *   - 모서리 k×k 블록: (col = T(k-1)..T(k)-1, row = T(k-1)..T(k)-1)
         *
         * 총 넓이 = k*T(k-1) + T(k-1)*k + k*k = 2k*T(k-1) + k² = k(2T(k-1)+k) = k·k² = k³  ✓
         */
        function getCubeShellBlocks(k) {
            const t0 = T(k - 1); // 이전 정사각형 한 변
            const t1 = T(k);     // 현재 정사각형 한 변
            const blocks = [];

            // 오른쪽 세로 띠
            for (let row = 0; row < t0; row++) {
                for (let col = t0; col < t1; col++) {
                    blocks.push({ row, col, part: 'right' });
                }
            }
            // 아래쪽 가로 띠
            for (let row = t0; row < t1; row++) {
                for (let col = 0; col < t0; col++) {
                    blocks.push({ row, col, part: 'bottom' });
                }
            }
            // 모서리 k×k
            for (let row = t0; row < t1; row++) {
                for (let col = t0; col < t1; col++) {
                    blocks.push({ row, col, part: 'corner' });
                }
            }
            return blocks;
        }

        function getBlockSize3(n) {
            if (!canvas3) return 20;
            const side = T(n); // 정사각형 한 변 (블록 단위)
            return Math.min(Math.floor((Math.min(canvas3.width, canvas3.height) - 60) / side), 36);
        }

        function drawCubePuzzle(n, highlightK, animBlocks) {
            if (!ctx3) return;
            const W = canvas3.width, H = canvas3.height;
            ctx3.clearRect(0, 0, W, H);

            const side = T(n);
            const bs = getBlockSize3(n);
            const ox = Math.floor((W - side * bs) / 2);
            const oy = Math.floor((H - side * bs) / 2);

            // 이미 채운 k=1..n 의 블록을 그린다
            for (let k = 1; k <= n; k++) {
                const color = PALETTE[(k - 1) % PALETTE.length];
                const dark = DARK_PALETTE[(k - 1) % DARK_PALETTE.length];
                const isHighlight = (highlightK !== undefined && k === highlightK);
                const isAnimated = (k === highlightK && animBlocks !== undefined);

                const blocks = getCubeShellBlocks(k);

                if (isAnimated) {
                    // 애니메이션 블록만 그리기 (일부)
                    for (let i = 0; i < animBlocks && i < blocks.length; i++) {
                        const b = blocks[i];
                        const x = ox + b.col * bs;
                        const y = oy + b.row * bs;
                        ctx3.fillStyle = hexToRgba(color, 0.85);
                        ctx3.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                        ctx3.strokeStyle = dark;
                        ctx3.lineWidth = 1.5;
                        ctx3.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    }
                } else {
                    for (const b of blocks) {
                        const x = ox + b.col * bs;
                        const y = oy + b.row * bs;
                        const alpha = isHighlight ? 1 : 0.82;
                        ctx3.fillStyle = hexToRgba(color, alpha);
                        ctx3.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                        ctx3.strokeStyle = dark;
                        ctx3.lineWidth = isHighlight ? 2 : 1.2;
                        ctx3.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    }
                }
            }

            // 큰 정사각형 테두리
            ctx3.strokeStyle = '#4a5568';
            ctx3.lineWidth = 3;
            ctx3.strokeRect(ox, oy, side * bs, side * bs);

            // 각 k 셸에 라벨
            if (bs >= 14) {
                for (let k = 1; k <= n; k++) {
                    const t0 = T(k - 1);
                    const t1 = T(k);
                    const cx = ox + (t0 + t1) / 2 * bs;
                    const cy = oy + (t0 + t1) / 2 * bs;
                    ctx3.fillStyle = 'rgba(0,0,0,0.55)';
                    ctx3.font = `bold ${Math.min(bs * 0.55, 13)}px Outfit, sans-serif`;
                    ctx3.textAlign = 'center';
                    ctx3.textBaseline = 'middle';
                    if (k <= (highlightK !== undefined ? highlightK : n)) {
                        ctx3.fillText(`k=${k}`, cx, cy);
                    }
                }
            }

            // 치수 표시
            ctx3.fillStyle = '#2d3748';
            ctx3.font = `bold ${Math.min(bs * 0.6, 14)}px Outfit, sans-serif`;
            ctx3.textAlign = 'center';
            ctx3.textBaseline = 'bottom';
            ctx3.fillText(`T(${n}) = ${side}`, ox + side * bs / 2, oy - 6);
            ctx3.textBaseline = 'middle';
            ctx3.textAlign = 'left';
            ctx3.save();
            ctx3.translate(ox + side * bs + 8, oy + side * bs / 2);
            ctx3.rotate(Math.PI / 2);
            ctx3.textBaseline = 'bottom';
            ctx3.fillText(`T(${n}) = ${side}`, 0, 0);
            ctx3.restore();
        }

        function drawSum3() {
            drawCubePuzzle(n3);
            updateFb3();
        }

        function updateFb3() {
            if (!fb3) return;
            const n = n3;
            const sum = [...Array(n).keys()].reduce((a, i) => a + (i + 1) ** 3, 0);
            const tn = T(n);
            fb3.innerHTML =
                `<span class="seq-fb-big">1³ + 2³ + ··· + ${n}³ = ${sum}</span><br>` +
                `<span class="seq-fb-sub">= (1 + 2 + ··· + ${n})² = <strong>${tn}² = ${tn * tn}</strong></span><br>` +
                `<span class="seq-fb-magic">✨ 항상 완벽한 정사각형! ✨</span>`;
            fb3.classList.add('show');
        }

        function animateCubePuzzle() {
            if (!ctx3 || anim3Running) return;
            anim3Running = true;
            if (runBtn3) runBtn3.disabled = true;

            // 먼저 빈 캔버스로 시작해 k=1부터 한 껍질씩 채움
            let k = 1;
            const n = n3;
            const delay = 350; // ms per shell
            const blockDelay = 15; // ms per block

            function animateShell() {
                if (k > n) {
                    // 완성
                    drawCubePuzzle(n);
                    updateFb3();
                    anim3Running = false;
                    if (runBtn3) runBtn3.disabled = false;
                    return;
                }

                const blocks = getCubeShellBlocks(k);
                let bi = 0;
                const totalBlocks = blocks.length;

                // 이전 껍질들은 완성 상태로 그리기
                const currentK = k;
                function step() {
                    bi += Math.max(1, Math.floor(totalBlocks / 40));
                    drawCubePuzzle(currentK - 1); // 이전까지 완성
                    // 현재 껍질 bi개 그리기
                    const color = PALETTE[(currentK - 1) % PALETTE.length];
                    const dark = DARK_PALETTE[(currentK - 1) % DARK_PALETTE.length];
                    const side = T(n);
                    const bs = getBlockSize3(n);
                    const ox = Math.floor((canvas3.width - side * bs) / 2);
                    const oy = Math.floor((canvas3.height - side * bs) / 2);

                    for (let i = 0; i < Math.min(bi, totalBlocks); i++) {
                        const b = blocks[i];
                        const x = ox + b.col * bs;
                        const y = oy + b.row * bs;
                        ctx3.fillStyle = hexToRgba(color, 0.88);
                        ctx3.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                        ctx3.strokeStyle = dark;
                        ctx3.lineWidth = 1.5;
                        ctx3.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    }

                    // 큰 정사각형 테두리
                    ctx3.strokeStyle = '#4a5568';
                    ctx3.lineWidth = 3;
                    ctx3.strokeRect(ox, oy, side * bs, side * bs);

                    if (bi < totalBlocks) {
                        anim3Id = requestAnimationFrame(step);
                    } else {
                        k++;
                        setTimeout(animateShell, delay);
                    }
                }
                step();
            }

            // 먼저 캔버스 초기화
            if (ctx3) ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
            if (fb3) { fb3.classList.remove('show'); }
            setTimeout(animateShell, 200);
        }

        if (slider3) {
            slider3.addEventListener('input', () => {
                n3 = parseInt(slider3.value);
                if (nVal3) nVal3.textContent = n3;
                if (anim3Running) { cancelAnimationFrame(anim3Id); anim3Running = false; }
                if (runBtn3) runBtn3.disabled = false;
                drawSum3();
            });
        }
        if (runBtn3) runBtn3.addEventListener('click', animateCubePuzzle);

        const reset3 = document.getElementById('seq-reset-btn-sum3');
        if (reset3) {
            reset3.addEventListener('click', () => {
                if (anim3Running) { cancelAnimationFrame(anim3Id); anim3Running = false; }
                if (fb3) fb3.classList.remove('show');
                if (runBtn3) runBtn3.disabled = false;
                drawSum3();
            });
        }

        /* ============================================================
           6. 최초 렌더 & 패널 초기화
        ============================================================ */
        // 캔버스 크기 설정 (반응형 고려)
        function resizeCanvases() {
            // unit-seq 컨테이너 크기를 기준으로 사용
            const unitSeq = document.getElementById('unit-seq');
            const containerW = unitSeq ? (unitSeq.clientWidth || 900) : 900;
            // 좌측 컨트롤 패널(~280px) + gap(28px)을 뺀 가용 너비
            const availW = Math.max(300, containerW - 320);

            [canvas1, canvas2, canvas3].forEach((c) => {
                if (!c) return;
                c.width = availW;
                c.height = Math.round(availW * 0.58);
            });
        }

        resizeCanvases();
        // 초기 탭 (sum1) 렌더 + sum2/sum3도 미리 초기화
        drawSum1();
        drawSum2(); // popScales2[0..3]=1 이미 세팅됨
        drawSum3();

        // 수열 패널이 visible 될 때 다시 맞게 그리도록
        window.seqRedraw = function () {
            resizeCanvases();
            const activePanel = document.querySelector('.seq-panel.active');
            if (!activePanel) return;
            const tab = activePanel.id.replace('seq-panel-', '');
            if (tab === 'sum1') drawSum1();
            else if (tab === 'sum2') drawSum2();
            else if (tab === 'sum3') drawSum3();
        };
    };
})();
