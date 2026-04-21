/* ========================================================= */
/* --- seq.js : 수열 시각화 (통합본)                       --- */
/* Σk / Σk²(3D) / Σk³ 세 탭을 하나의 파일로 관리          --- */
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
            '#ffb3c6', '#a8d8ea', '#b5ead7', '#ffd6a5', '#c9b1ff',
            '#caffbf', '#fdffb6', '#9bf6ff', '#ffadad', '#bde0fe',
            '#d4f1f4', '#fce1e4', '#dfe7fd', '#e8f5e9', '#fff9c4',
            '#f3e5f5', '#e0f7fa', '#fce4ec', '#f1f8e9', '#fff3e0',
        ];
        const DARK_PALETTE = PALETTE.map(c => {
            const r = parseInt(c.slice(1, 3), 16);
            const g = parseInt(c.slice(3, 5), 16);
            const b = parseInt(c.slice(5, 7), 16);
            return `rgb(${Math.max(0, r - 55)},${Math.max(0, g - 55)},${Math.max(0, b - 55)})`;
        });
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${alpha})`;
        }

        /* ============================================================
           1. 탭 전환
        ============================================================ */
        const panels = {
            sum1: document.getElementById('seq-panel-sum1'),
            sum2: document.getElementById('seq-panel-sum2'),
            sum3: document.getElementById('seq-panel-sum3'),
            hanoi: document.getElementById('seq-panel-hanoi'),
        };

        function switchPanel(tab) {
            Object.values(panels).forEach(p => { if (p) p.classList.remove('active'); });
            if (panels[tab]) panels[tab].classList.add('active');
            document.querySelectorAll('#idx-seq .index-tab').forEach(t =>
                t.classList.toggle('active', t.dataset.seqtab === tab)
            );
            if (tab === 'sum1') drawSum1();
            if (tab === 'sum2') sum2Redraw();
            if (tab === 'sum3') drawSum3();
            if (tab === 'hanoi') { if (window.initHanoi) window.initHanoi(); }
        }

        document.querySelectorAll('#idx-seq .index-tab').forEach(t =>
            t.addEventListener('click', () => switchPanel(t.dataset.seqtab))
        );
        window.seqSwitchPanel = switchPanel;

        /* ============================================================
           2. KaTeX
        ============================================================ */
        function renderKatex(selector, latex) {
            const el = document.querySelector(selector);
            if (!el || !window.katex) return;
            katex.render(latex, el, { throwOnError: false, displayMode: true });
        }
        renderKatex('#seq-formula-sum1', '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}');
        renderKatex('#seq-formula-sum2', '\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}');
        renderKatex('#seq-formula-sum3', '\\sum_{k=1}^{n} k^3 = \\left(\\frac{n(n+1)}{2}\\right)^2');

        /* ============================================================
           3. TAB 1 — Σk 계단탑
        ============================================================ */
        const canvas1 = document.getElementById('seq-canvas-sum1');
        const ctx1 = canvas1 ? canvas1.getContext('2d') : null;
        const slider1 = document.getElementById('seq-slider-sum1');
        const nVal1 = document.getElementById('seq-n-val-sum1');
        const runBtn1 = document.getElementById('seq-run-btn-sum1');
        const fb1 = document.getElementById('seq-feedback-sum1');

        let n1 = 5, anim1Id = null, anim1Running = false;

        function getBlockSize1(n) {
            if (!canvas1) return 30;
            return Math.min(Math.floor((canvas1.width - 80) / (n + 1)), 40);
        }

        function drawSum1(animOffset) {
            if (!ctx1) return;
            const n = n1, W = canvas1.width, H = canvas1.height;
            const bs = getBlockSize1(n);
            const gridW = (n + 1) * bs, gridH = n * bs;
            const ox = Math.floor((W - gridW) / 2), oy = Math.floor((H - gridH) / 2);

            ctx1.clearRect(0, 0, W, H);
            ctx1.strokeStyle = 'rgba(0,0,0,0.05)'; ctx1.lineWidth = 0.5;
            for (let r = 0; r <= n; r++) { ctx1.beginPath(); ctx1.moveTo(ox, oy + r * bs); ctx1.lineTo(ox + (n + 1) * bs, oy + r * bs); ctx1.stroke(); }
            for (let c = 0; c <= n + 1; c++) { ctx1.beginPath(); ctx1.moveTo(ox + c * bs, oy); ctx1.lineTo(ox + c * bs, oy + n * bs); ctx1.stroke(); }

            for (let k = 1; k <= n; k++) {
                const row = k - 1, color = PALETTE[(k - 1) % PALETTE.length], dark = DARK_PALETTE[(k - 1) % DARK_PALETTE.length];
                for (let col = 0; col < k; col++) {
                    const x = ox + col * bs, y = oy + row * bs;
                    ctx1.fillStyle = color; ctx1.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                    ctx1.strokeStyle = dark; ctx1.lineWidth = 1.5; ctx1.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    if (bs >= 20) { ctx1.fillStyle = 'rgba(0,0,0,0.45)'; ctx1.font = `bold ${Math.min(bs * 0.38, 13)}px Outfit,sans-serif`; ctx1.textAlign = 'center'; ctx1.textBaseline = 'middle'; ctx1.fillText(k, x + bs / 2, y + bs / 2); }
                }
            }
            if (animOffset !== undefined) {
                const alpha = animOffset === 0 ? 0.75 : 0.55;
                for (let k = 1; k <= n; k++) {
                    const row = k - 1, color = PALETTE[(n - k) % PALETTE.length], dark = DARK_PALETTE[(n - k) % DARK_PALETTE.length];
                    for (let col = k; col <= n; col++) {
                        const x = ox + col * bs, y = oy + row * bs - animOffset;
                        ctx1.fillStyle = hexToRgba(color, alpha); ctx1.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                        ctx1.strokeStyle = dark; ctx1.lineWidth = 1; ctx1.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    }
                }
            }
            if (animOffset === 0) {
                ctx1.strokeStyle = '#e53e3e'; ctx1.lineWidth = 3; ctx1.setLineDash([6, 3]);
                ctx1.strokeRect(ox, oy, (n + 1) * bs, n * bs); ctx1.setLineDash([]);
                ctx1.fillStyle = '#e53e3e'; ctx1.font = `bold ${Math.min(bs * 0.5, 16)}px Outfit,sans-serif`;
                ctx1.textAlign = 'center'; ctx1.textBaseline = 'bottom';
                ctx1.fillText(`n+1 = ${n + 1}`, ox + (n + 1) * bs / 2, oy - 6);
                ctx1.textAlign = 'right'; ctx1.textBaseline = 'middle';
                ctx1.fillText(`n = ${n}`, ox - 6, oy + n * bs / 2);
            }
        }

        function animateSum1() {
            if (!ctx1 || anim1Running) return;
            anim1Running = true; if (runBtn1) runBtn1.disabled = true;
            if (fb1) fb1.style.opacity = '0';
            const n = n1, bs = getBlockSize1(n), totalDrop = (n + 1) * bs;
            let offset = totalDrop; const speed = Math.max(3, totalDrop / 50);
            function step() {
                offset -= speed;
                if (offset <= 0) {
                    offset = 0; drawSum1(0);
                    if (fb1) { const sum = n * (n + 1) / 2; fb1.innerHTML = `<span class="seq-fb-big">총 넓이 = n × (n+1) = ${n} × ${n + 1} = ${n * (n + 1)}</span><br><span class="seq-fb-sub">따라서 원래 구하려던 합은 절반인</span><span class="seq-fb-formula"> ${n}(${n + 1}) ÷ 2 = <strong>${sum}</strong></span>`; fb1.classList.add('show'); fb1.style.opacity = '1'; }
                    anim1Running = false; if (runBtn1) runBtn1.disabled = false; return;
                }
                drawSum1(offset); anim1Id = requestAnimationFrame(step);
            }
            anim1Id = requestAnimationFrame(step);
        }

        if (slider1) slider1.addEventListener('input', () => { n1 = parseInt(slider1.value); if (nVal1) nVal1.textContent = n1; if (anim1Running) { cancelAnimationFrame(anim1Id); anim1Running = false; } if (fb1) { fb1.classList.remove('show'); fb1.style.opacity = '0'; } if (runBtn1) runBtn1.disabled = false; drawSum1(); });
        if (runBtn1) runBtn1.addEventListener('click', animateSum1);
        const reset1 = document.getElementById('seq-reset-btn-sum1');
        if (reset1) reset1.addEventListener('click', () => { if (anim1Running) { cancelAnimationFrame(anim1Id); anim1Running = false; } if (fb1) { fb1.classList.remove('show'); fb1.style.opacity = '0'; } if (runBtn1) runBtn1.disabled = false; drawSum1(); });

        /* ============================================================
           4. TAB 2 — Σk² 3D 시각화
           3개 계단 피라미드 → 합치기 → 절반 잘라 이동 → 직육면체
        ============================================================ */
        const canvas2 = document.getElementById('seq-canvas-sum2');
        const ctx2 = canvas2 ? canvas2.getContext('2d') : null;
        const slider2 = document.getElementById('seq-slider-sum2');
        const nVal2 = document.getElementById('seq-n-val-sum2');
        const fb2 = document.getElementById('seq-feedback-sum2');

        /* 3D 색상 세트 */
        const COL3D = {
            A: { face: ['#ffb3c6', '#e8809a', '#d45c7a'], edge: '#b03060' },
            B: { face: ['#a8d8ea', '#7ab8d4', '#5097b8'], edge: '#2e6e8a' },
            C: { face: ['#b5ead7', '#7fcfb0', '#4db48e'], edge: '#2d8060' },
            HALF: { face: ['#ffd6a5', '#f0a850', '#d08020'], edge: '#a05010' },
        };

        let n2 = 4;
        let s2State = 'separate';   // separate | merging | merged | cutting | done
        let s2Prog = 0;
        let s2RotY = -Math.PI / 4;  // -45도 (대각선 측면)
        let s2RotX = Math.PI / 4;   // +45도 (위에서 아래로 더 깊게 내려다보기)
        let s2Drag = false;
        let s2LastMX = 0, s2LastMY = 0;
        let s2AnimRaf = null;
        let s2Zoom = 1.0;  // 줌 변수 추가

        /* 회전 */
        function rot3D(x, y, z) {
            const x1 = x * Math.cos(s2RotY) + z * Math.sin(s2RotY), z1 = -x * Math.sin(s2RotY) + z * Math.cos(s2RotY);
            const y2 = y * Math.cos(s2RotX) - z1 * Math.sin(s2RotX), z2 = y * Math.sin(s2RotX) + z1 * Math.cos(s2RotX);
            return [x1, y2, z2];
        }
        /* 투영 */
        function proj3D(x, y, z, cx, cy, scale) {
            const fov = 30, zOff = fov + z; // 원근감(FOV)을 확 늘려서 테두리 부분의 심한 왜곡 방지
            return [cx + x / zOff * scale * fov, cy - y / zOff * scale * fov];
        }
        /* 큐브 1개의 면 생성 */
        function makeCubeFaces(bx, by, bz, cs, h = 1) {
            return [
                { pts: [[bx, by + h, bz], [bx + 1, by + h, bz], [bx + 1, by + h, bz + 1], [bx, by + h, bz + 1]], norm: [0, 1, 0], ci: 0, cs },
                { pts: [[bx, by, bz + 1], [bx + 1, by, bz + 1], [bx + 1, by + h, bz + 1], [bx, by + h, bz + 1]], norm: [0, 0, 1], ci: 1, cs },
                { pts: [[bx + 1, by, bz], [bx + 1, by + h, bz], [bx + 1, by + h, bz + 1], [bx + 1, by, bz + 1]], norm: [1, 0, 0], ci: 2, cs },
                { pts: [[bx, by, bz], [bx, by + h, bz], [bx, by + h, bz + 1], [bx, by, bz + 1]], norm: [-1, 0, 0], ci: 2, cs },
                { pts: [[bx, by, bz], [bx + 1, by, bz], [bx + 1, by + h, bz], [bx, by + h, bz]], norm: [0, 0, -1], ci: 1, cs },
                { pts: [[bx, by, bz], [bx + 1, by, bz], [bx + 1, by, bz + 1], [bx, by, bz + 1]], norm: [0, -1, 0], ci: 0, cs },
            ];
        }
        /* 계단 피라미드 블록 목록 */
        function makePyramid2(n, cs) {
            const blocks = [];
            for (let k = 1; k <= n; k++) {
                const size = n + 1 - k;
                for (let bx = 0; bx < size; bx++) for (let bz = 0; bz < size; bz++)
                    blocks.push({ x: bx, y: k - 1, z: bz, cs });
            }
            return blocks;
        }
        function easeIO(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

        function renderSum2() {
            if (!ctx2 || !canvas2) return;
            const W = canvas2.width, H = canvas2.height, n = n2;
            ctx2.clearRect(0, 0, W, H);

            const scale = (Math.min(W, H) / (n * 3.0)) * s2Zoom;
            const cx = W / 2, cy = H * 0.75;
            let allFaces = [];

            const p = (s2State === 'separate') ? 0 :
                (s2State === 'merging') ? easeIO(s2Prog) : 1;

            const gapX = n * 1.8; // 분리 시에 피라미드들이 너무 겹치지 않고 넓게 벌어지도록 조정

            // cutting 상태일 경우 (최상단 절반 지그재그 층) 띄우기
            const cutLift = (s2State === 'cutting') ? easeIO(s2Prog) * n * 0.8 :
                (s2State === 'done') ? n * 0.8 : 0;

            const cxOff = n * 0.5;
            const czOff = n * 0.5;

            // A: 왼쪽
            makePyramid2(n, COL3D.A).forEach(b => {
                const startX = b.x - gapX - cxOff;
                const startY = b.y;
                const startZ = b.z - czOff;

                const endX = b.y - cxOff;
                const endY = (b.x + b.y);
                const endZ = (b.z + b.y) - czOff;

                allFaces.push(...makeCubeFaces(
                    startX * (1 - p) + endX * p,
                    startY * (1 - p) + endY * p,
                    startZ * (1 - p) + endZ * p,
                    COL3D.A
                ));
            });

            // B: 가운데
            makePyramid2(n, COL3D.B).forEach(b => {
                const startX = b.x - cxOff;
                const startY = b.y;
                const startZ = b.z - czOff;

                const endX = (b.x + b.y + 1) - cxOff;
                const endY = b.y;
                const endZ = (b.z + b.y) - czOff;

                allFaces.push(...makeCubeFaces(
                    startX * (1 - p) + endX * p,
                    startY * (1 - p) + endY * p,
                    startZ * (1 - p) + endZ * p,
                    COL3D.B
                ));
            });

            // C: 오른쪽
            makePyramid2(n, COL3D.C).forEach(b => {
                const startX = b.x + gapX - cxOff;
                const startY = b.y;
                const startZ = b.z - czOff;

                const endX = (b.z + b.y + 1) - cxOff;
                const endY = (b.x + b.y + 1);
                const endZ = b.y - czOff;

                const isTop = (endY === n) && (p === 1);

                if (isTop && (s2State === 'cutting' || s2State === 'done')) {
                    const cutP = (s2State === 'done') ? 1 : easeIO(s2Prog);

                    // 절반 두께(0.5)의 아랫부분 블록 생성
                    allFaces.push(...makeCubeFaces(
                        startX * (1 - p) + endX * p,
                        startY * (1 - p) + endY * p,
                        startZ * (1 - p) + endZ * p,
                        COL3D.C,
                        0.5
                    ));

                    // 중심점을 기준으로 반 바퀴(180도) 회전
                    const theta = cutP * Math.PI;
                    const rx = 0.5, rz = 0; // 기하학적 중심축 (렌더링 좌표계)
                    const cosT = Math.cos(theta);
                    const sinT = Math.sin(theta);

                    // 아치 모양으로 공중에 살짝 띄웠다가 빈 곳으로 들어가는 자연스러운 Y축 모션
                    const arcY = Math.sin(cutP * Math.PI) * (n * 0.4);
                    const dropY = -0.5 * cutP + arcY;

                    let topFaces = makeCubeFaces(
                        startX * (1 - p) + endX * p,
                        startY * (1 - p) + endY * p + 0.5, // 0.5 더 높은 곳(상반부)에서 시작
                        startZ * (1 - p) + endZ * p,
                        COL3D.HALF,
                        0.5
                    );

                    topFaces.forEach(f => {
                        f.pts.forEach(pt => {
                            const dx = pt[0] - rx;
                            const dz = pt[2] - rz;
                            // 회전 변환
                            pt[0] = rx + dx * cosT - dz * sinT;
                            pt[2] = rz + dx * sinT + dz * cosT;
                            // Y축 승강
                            pt[1] += dropY;
                        });
                        // 법선 벡터 업데이트
                        const nx = f.norm[0];
                        const nz = f.norm[2];
                        f.norm[0] = nx * cosT - nz * sinT;
                        f.norm[2] = nx * sinT + nz * cosT;
                    });

                    allFaces.push(...topFaces);

                } else {
                    allFaces.push(...makeCubeFaces(
                        startX * (1 - p) + endX * p,
                        startY * (1 - p) + endY * p,
                        startZ * (1 - p) + endZ * p,
                        COL3D.C
                    ));
                }
            });

            /* 화가 알고리즘 */
            const projected = allFaces.map(face => {
                const rp = face.pts.map(([x, y, z]) => rot3D(x, y, z));
                const avgZ = rp.reduce((s, p) => s + p[2], 0) / 4;
                const [rnx, rny, rnz] = rot3D(...face.norm);
                const [r0x, r0y, r0z] = rot3D(0, 0, 0);
                const dot = -(rnz - r0z);
                return { face, rp, avgZ, dot };
            }).filter(f => f.dot > -0.15);
            projected.sort((a, b) => b.avgZ - a.avgZ);

            projected.forEach(({ face, rp, dot }) => {
                const { ci, cs } = face;
                const pts2D = rp.map(([rx, ry, rz]) => proj3D(rx, ry, rz, cx, cy, scale));
                const lf = [1.0, 0.75, 0.55];
                const lv = Math.max(0.3, (dot + 1) * 0.5 * lf[ci] + lf[ci] * 0.2);
                const bc = cs.face[ci];
                const r = parseInt(bc.slice(1, 3), 16), g = parseInt(bc.slice(3, 5), 16), b = parseInt(bc.slice(5, 7), 16);
                ctx2.beginPath();
                ctx2.moveTo(pts2D[0][0], pts2D[0][1]);
                for (let i = 1; i < pts2D.length; i++) ctx2.lineTo(pts2D[i][0], pts2D[i][1]);
                ctx2.closePath();
                ctx2.fillStyle = `rgb(${Math.round(r * lv)},${Math.round(g * lv)},${Math.round(b * lv)})`;
                ctx2.fill();
                ctx2.strokeStyle = cs.edge; ctx2.lineWidth = 0.7; ctx2.stroke();
            });

            /* 모서리 수치 길이 표시 라벨 (직육면체 완성 시) */
            if (s2State === 'done') {
                ctx2.save();
                ctx2.font = 'bold 22px Outfit, sans-serif'; // 크기 키움
                ctx2.textAlign = 'center';
                ctx2.textBaseline = 'middle';

                const drawLabel = (trueX, trueY, trueZ, text) => {
                    const [rx, ry, rz] = rot3D(trueX - cxOff, trueY, trueZ - czOff);
                    const [px, py] = proj3D(rx, ry, rz, cx, cy, scale);

                    const tw = ctx2.measureText(text).width;
                    const padx = 12, pady = 8;
                    ctx2.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx2.beginPath();
                    ctx2.roundRect(px - tw / 2 - padx, py - 11 - pady, tw + padx * 2, 22 + pady * 2, 10);
                    ctx2.fill();
                    ctx2.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                    ctx2.lineWidth = 1;
                    ctx2.stroke();

                    ctx2.fillStyle = '#e53e3e';
                    ctx2.fillText(text, px, py);
                };

                // 가로 길이 (X축: 0 ~ n+1)
                // 전면 하단 모서리의 중앙 부분: X = (n+1)/2, Y = 0, Z = n + 0.5 (표시가 겹치지 않게 살짝 앞으로 뺌)
                drawLabel((n + 1) / 2, -0.2, n + 0.5, String(n + 1));

                // 세로 깊이 (Z축: 0 ~ n)
                // 우측 하단 모서리의 중앙 부분: X = n + 1.5, Y = 0, Z = n / 2
                drawLabel(n + 1 + 0.5, -0.2, n / 2, String(n));

                // 높이 (Y축: 0 ~ n+0.5)
                // 우측 전면 수직 모서리의 중앙 부분: X = n + 1.3, Y = (n + 0.5) / 2, Z = n + 0.3
                drawLabel(n + 1 + 0.3, (n + 0.5) / 2, n + 0.3, String(n + 0.5));

                ctx2.restore();
            }

            /* HUD */
            const sum = n * (n + 1) * (2 * n + 1) / 6;
            const hudMsg = {
                separate: ``,
                merging: ``,
                merged: ``,
                cutting: ``,
                done: ``,
            };
            ctx2.save();
            ctx2.textAlign = 'center'; ctx2.font = `bold ${s2State === 'done' ? 14 : 13}px Outfit,sans-serif`;
            ctx2.fillStyle = s2State === 'done' ? '#e53e3e' : '#2d3748';
            ctx2.fillText(hudMsg[s2State] || '', W / 2, H - 12);
            // 범례
            [{ col: COL3D.A.face[0], t: 'A' }, { col: COL3D.B.face[0], t: 'B' }, { col: COL3D.C.face[0], t: 'C' }, { col: COL3D.HALF.face[0], t: '절반' }].forEach((l, i) => {
                const lx = 10, ly = 18 + i * 18;
                ctx2.fillStyle = l.col; ctx2.fillRect(lx, ly - 9, 11, 11);
                ctx2.strokeStyle = '#888'; ctx2.lineWidth = 0.5; ctx2.strokeRect(lx, ly - 9, 11, 11);
                ctx2.fillStyle = '#2d3748'; ctx2.font = '600 11px Outfit,sans-serif';
                ctx2.textAlign = 'left'; ctx2.fillText(l.t, lx + 14, ly);
            });
            ctx2.fillStyle = '#a0aec0'; ctx2.font = '11px Outfit,sans-serif';
            ctx2.textAlign = 'right'; ctx2.fillText('🖱 드래그 회전', W - 8, H - 8);
            ctx2.restore();
        }

        function updateFb2() {
            if (!fb2) return;
            const n = n2, sum = n * (n + 1) * (2 * n + 1) / 6;
            const msgs = {
                separate: `<span class="seq-fb-big">1² + 2² + ··· + ${n}² = ?</span><br><span class="seq-fb-sub">3개의 계단 피라미드를 합쳐보세요</span>`,
                merged: `<span class="seq-fb-big">3 × Σk² = 계단형 덩어리</span><br><span class="seq-fb-sub">위쪽 절반을 잘라 옆에 붙이면 직육면체가 됩니다</span>`,
                done: `<div class="seq-fb-big" style="display: inline-grid; grid-template-columns: auto auto; gap: 12px 6px; text-align: left; align-items: center;">
                    <div style="text-align: right;">Σk²</div>
                    <div>= n(n+1)(n+1/2) ÷ 3</div>
                    <div></div>
                    <div>= n(n+1)(2n+1) ÷ 6 = <strong>${sum}</strong></div>
                </div>`,
            };
            const msg = msgs[s2State] || msgs.separate;
            fb2.innerHTML = msg; fb2.classList.add('show');
        }

        function s2Animate(dur, onDone) {
            if (s2AnimRaf) cancelAnimationFrame(s2AnimRaf);
            const start = performance.now();
            function step(now) {
                s2Prog = easeIO(Math.min(1, (now - start) / dur));
                renderSum2();
                if (s2Prog < 1) s2AnimRaf = requestAnimationFrame(step);
                else { s2AnimRaf = null; if (onDone) onDone(); }
            }
            s2AnimRaf = requestAnimationFrame(step);
        }

        function sum2Redraw() {
            /* 캔버스 크기 재설정 */
            const unitSeq = document.getElementById('unit-seq');
            const availW = Math.max(300, (unitSeq ? unitSeq.clientWidth : 900) - 60);
            canvas2.width = availW; canvas2.height = Math.round(availW * 0.55);
            renderSum2(); updateFb2();
        }

        /* 드래그 회전 */
        if (canvas2) {
            canvas2.addEventListener('mousedown', e => { s2Drag = true; s2LastMX = e.clientX; s2LastMY = e.clientY; });
            window.addEventListener('mousemove', e => {
                if (!s2Drag) return;
                s2RotY += (e.clientX - s2LastMX) * 0.012; s2RotX += (e.clientY - s2LastMY) * 0.012;
                s2RotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, s2RotX));
                s2LastMX = e.clientX; s2LastMY = e.clientY; renderSum2();
            });
            window.addEventListener('mouseup', () => s2Drag = false);
            /* 터치 */
            let s2LastT = null;
            canvas2.addEventListener('touchstart', e => { if (e.touches.length === 1) { s2Drag = true; s2LastMX = e.touches[0].clientX; s2LastMY = e.touches[0].clientY; } }, { passive: true });
            canvas2.addEventListener('touchmove', e => {
                if (!s2Drag || e.touches.length !== 1) return; e.preventDefault();
                s2RotY += (e.touches[0].clientX - s2LastMX) * 0.012; s2RotX += (e.touches[0].clientY - s2LastMY) * 0.012;
                s2RotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, s2RotX));
                s2LastMX = e.touches[0].clientX; s2LastMY = e.touches[0].clientY; renderSum2();
            }, { passive: false });
            canvas2.addEventListener('touchend', () => s2Drag = false);

            // 휠 줌 추가
            canvas2.addEventListener('wheel', e => {
                e.preventDefault();
                s2Zoom *= e.deltaY < 0 ? 1.1 : 0.9;
                s2Zoom = Math.max(0.3, Math.min(3.0, s2Zoom));
                renderSum2();
            }, { passive: false });
        }

        /* 버튼 */
        const btnMerge = document.getElementById('seq2-btn-merge');
        const btnCut = document.getElementById('seq2-btn-cut');
        const btnReset = document.getElementById('seq2-btn-reset');
        if (btnMerge) btnMerge.addEventListener('click', () => {
            if (s2State !== 'separate') return;
            s2State = 'merging'; s2Prog = 0;
            s2Animate(1200, () => { s2State = 'merged'; renderSum2(); updateFb2(); });
        });
        if (btnCut) btnCut.addEventListener('click', () => {
            if (s2State !== 'merged') return;
            s2State = 'cutting'; s2Prog = 0;
            s2Animate(1000, () => { s2State = 'done'; renderSum2(); updateFb2(); });
        });
        if (btnReset) btnReset.addEventListener('click', () => {
            if (s2AnimRaf) cancelAnimationFrame(s2AnimRaf);
            s2State = 'separate'; s2Prog = 0;
            s2Zoom = 1.0;  // 줌 리셋 추가
            renderSum2(); updateFb2();
        });

        /* 슬라이더 */
        if (slider2) slider2.addEventListener('input', () => {
            n2 = parseInt(slider2.value);
            if (nVal2) nVal2.textContent = n2;
            if (s2AnimRaf) { cancelAnimationFrame(s2AnimRaf); s2AnimRaf = null; }
            s2State = 'separate'; s2Prog = 0;
            s2Zoom = 1.0;  // 줌 리셋 추가
            renderSum2(); updateFb2();
        });

        /* ============================================================
           5. TAB 3 — Σk³ ㄱ자 퍼즐
        ============================================================ */
        const canvas3 = document.getElementById('seq-canvas-sum3');
        const ctx3 = canvas3 ? canvas3.getContext('2d') : null;
        const slider3 = document.getElementById('seq-slider-sum3');
        const nVal3 = document.getElementById('seq-n-val-sum3');
        const runBtn3 = document.getElementById('seq-run-btn-sum3');
        const fb3 = document.getElementById('seq-feedback-sum3');
        let n3 = 3, anim3Id = null, anim3Running = false;

        function T(n) { return n * (n + 1) / 2; }
        function getCubeShellBlocks(k) {
            const t0 = T(k - 1), t1 = T(k), blocks = [];
            for (let r = 0; r < t0; r++) for (let c = t0; c < t1; c++) blocks.push({ row: r, col: c, part: 'right' });
            for (let r = t0; r < t1; r++) for (let c = 0; c < t0; c++) blocks.push({ row: r, col: c, part: 'bottom' });
            for (let r = t0; r < t1; r++) for (let c = t0; c < t1; c++) blocks.push({ row: r, col: c, part: 'corner' });
            return blocks;
        }
        function getBlockSize3(n) {
            if (!canvas3) return 20;
            return Math.min(Math.floor((Math.min(canvas3.width, canvas3.height) - 60) / T(n)), 36);
        }
        function drawCubePuzzle(n, highlightK, animBlocks) {
            if (!ctx3) return;
            const W = canvas3.width, H = canvas3.height, side = T(n), bs = getBlockSize3(n);
            const ox = Math.floor((W - side * bs) / 2), oy = Math.floor((H - side * bs) / 2);
            ctx3.clearRect(0, 0, W, H);
            for (let k = 1; k <= n; k++) {
                const color = PALETTE[(k - 1) % PALETTE.length], dark = DARK_PALETTE[(k - 1) % DARK_PALETTE.length];
                const isAnim = (k === highlightK && animBlocks !== undefined);
                const blocks = getCubeShellBlocks(k);
                if (isAnim) {
                    for (let i = 0; i < animBlocks && i < blocks.length; i++) {
                        const b = blocks[i], x = ox + b.col * bs, y = oy + b.row * bs;
                        ctx3.fillStyle = hexToRgba(color, 0.85); ctx3.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                        ctx3.strokeStyle = dark; ctx3.lineWidth = 1.5; ctx3.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    }
                } else {
                    const alpha = (highlightK !== undefined && k === highlightK) ? 1 : 0.82;
                    for (const b of blocks) {
                        const x = ox + b.col * bs, y = oy + b.row * bs;
                        ctx3.fillStyle = hexToRgba(color, alpha); ctx3.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                        ctx3.strokeStyle = dark; ctx3.lineWidth = k === highlightK ? 2 : 1.2; ctx3.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    }
                }
            }
            ctx3.strokeStyle = '#4a5568'; ctx3.lineWidth = 3; ctx3.strokeRect(ox, oy, side * bs, side * bs);
            if (bs >= 14) {
                for (let k = 1; k <= n; k++) {
                    const t0 = T(k - 1), t1 = T(k);
                    if (k <= (highlightK !== undefined ? highlightK : n)) {
                        ctx3.fillStyle = 'rgba(0,0,0,0.55)';
                        ctx3.font = `bold ${Math.min(bs * 0.55, 13)}px Outfit,sans-serif`;
                        ctx3.textAlign = 'center'; ctx3.textBaseline = 'middle';
                        ctx3.fillText(`k=${k}`, ox + (t0 + t1) / 2 * bs, oy + (t0 + t1) / 2 * bs);
                    }
                }
            }
            ctx3.fillStyle = '#2d3748'; ctx3.font = `bold ${Math.min(bs * 0.6, 14)}px Outfit,sans-serif`;
            ctx3.textAlign = 'center'; ctx3.textBaseline = 'bottom';
            ctx3.fillText(`T(${n}) = ${side}`, ox + side * bs / 2, oy - 6);
        }
        function drawSum3() { drawCubePuzzle(n3); updateFb3(); }
        function updateFb3() {
            if (!fb3) return;
            const n = n3, sum = [...Array(n).keys()].reduce((a, i) => a + (i + 1) ** 3, 0), tn = T(n);
            fb3.innerHTML = `<span class="seq-fb-big">1³ + 2³ + ··· + ${n}³ = ${sum}</span><br><span class="seq-fb-sub">= (1+2+···+${n})² = <strong>${tn}² = ${tn * tn}</strong></span><br><span class="seq-fb-magic">✨ 항상 완벽한 정사각형! ✨</span>`;
            fb3.classList.add('show');
        }
        function animateCubePuzzle() {
            if (!ctx3 || anim3Running) return;
            anim3Running = true; if (runBtn3) runBtn3.disabled = true;
            let k = 1; const n = n3;
            function animateShell() {
                if (k > n) { drawCubePuzzle(n); updateFb3(); anim3Running = false; if (runBtn3) runBtn3.disabled = false; return; }
                const blocks = getCubeShellBlocks(k), total = blocks.length;
                let bi = 0; const ck = k;
                const color = PALETTE[(ck - 1) % PALETTE.length], dark = DARK_PALETTE[(ck - 1) % DARK_PALETTE.length];
                const side = T(n), bs = getBlockSize3(n);
                const ox = Math.floor((canvas3.width - side * bs) / 2), oy = Math.floor((canvas3.height - side * bs) / 2);
                function step() {
                    bi += Math.max(1, Math.floor(total / 40));
                    drawCubePuzzle(ck - 1);
                    for (let i = 0; i < Math.min(bi, total); i++) {
                        const b = blocks[i], x = ox + b.col * bs, y = oy + b.row * bs;
                        ctx3.fillStyle = hexToRgba(color, 0.88); ctx3.fillRect(x + 1, y + 1, bs - 2, bs - 2);
                        ctx3.strokeStyle = dark; ctx3.lineWidth = 1.5; ctx3.strokeRect(x + 1, y + 1, bs - 2, bs - 2);
                    }
                    ctx3.strokeStyle = '#4a5568'; ctx3.lineWidth = 3; ctx3.strokeRect(ox, oy, side * bs, side * bs);
                    if (bi < total) anim3Id = requestAnimationFrame(step);
                    else { k++; setTimeout(animateShell, 350); }
                }
                step();
            }
            ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
            if (fb3) fb3.classList.remove('show');
            setTimeout(animateShell, 200);
        }
        if (slider3) slider3.addEventListener('input', () => { n3 = parseInt(slider3.value); if (nVal3) nVal3.textContent = n3; if (anim3Running) { cancelAnimationFrame(anim3Id); anim3Running = false; } if (runBtn3) runBtn3.disabled = false; drawSum3(); });
        if (runBtn3) runBtn3.addEventListener('click', animateCubePuzzle);
        const reset3 = document.getElementById('seq-reset-btn-sum3');
        if (reset3) reset3.addEventListener('click', () => { if (anim3Running) { cancelAnimationFrame(anim3Id); anim3Running = false; } if (fb3) fb3.classList.remove('show'); if (runBtn3) runBtn3.disabled = false; drawSum3(); });

        /* ============================================================
           6. 초기 렌더
        ============================================================ */
        function resizeCanvases() {
            const unitSeq = document.getElementById('unit-seq');
            const availW = Math.max(300, (unitSeq ? unitSeq.clientWidth : 900) - 60);
            [canvas1, canvas3].forEach(c => { if (!c) return; c.width = availW; c.height = Math.round(availW * 0.55); });
            /* canvas2는 sum2Redraw에서 처리 */
            if (canvas2) { canvas2.width = availW; canvas2.height = Math.round(availW * 0.55); }
        }

        resizeCanvases();
        drawSum1();
        sum2Redraw();
        drawSum3();

        /* 단원 진입 시 리드로우 */
        window.seqRedraw = function () {
            resizeCanvases();
            const active = document.querySelector('.seq-panel.active');
            if (!active) return;
            const tab = active.id.replace('seq-panel-', '');
            if (tab === 'sum1') drawSum1();
            else if (tab === 'sum2') sum2Redraw();
            else if (tab === 'sum3') drawSum3();
            else if (tab === 'hanoi') { if (window.initHanoi) window.initHanoi(); }
        };
    };
})();

/* ========================================================= */
/* --- 하노이탑 (Tower of Hanoi) Logic --- */
/* ========================================================= */
window.initHanoi = (function () {
    let _initialized = false;

    return function () {
        if (_initialized) { drawHanoi(); return; }
        _initialized = true;

        const canvas = document.getElementById('hanoi-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let n = 3;
        let pegs = [[], [], []];
        let moveCount = 0;
        let selected = null;
        let autoTimer = null;

        const COLORS = [
            '#fc8181', '#f6ad55', '#f6e05e',
            '#68d391', '#4fd1c5', '#73a5ff', '#b794f4'
        ];

        function initGame() {
            pegs = [[], [], []];
            for (let i = n; i >= 1; i--) pegs[0].push(i);
            moveCount = 0;
            selected = null;
            updateUI();
            drawHanoi();
            document.getElementById('hanoi-feedback').innerText = '';
        }

        function updateUI() {
            document.getElementById('hanoi-move-count').innerText = moveCount;
            const minMoves = Math.pow(2, n) - 1;
            document.getElementById('hanoi-min-moves').innerText = minMoves;
            document.getElementById('hanoi-formula-detail').innerHTML =
                `n=${n}일 때: 2<sup>${n}</sup> − 1 = <strong style="color:#e53e3e;">${minMoves}</strong>`;
        }

        function drawHanoi() {
            const W = canvas.width, H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#f8faff');
            bg.addColorStop(1, '#ffffff');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            const baseY = H - 50;
            const pegX = [W / 4, W / 2, W * 3 / 4];
            const pegH = H - 100;
            const maxDiskW = W / 4 - 20;
            const diskH = Math.min(28, (pegH - 20) / (n + 1));

            // 바닥
            ctx.fillStyle = '#cbd5e0';
            ctx.beginPath();
            ctx.roundRect(40, baseY, W - 80, 12, 6);
            ctx.fill();

            // 기둥 레이블
            ['A', 'B', 'C'].forEach((label, i) => {
                ctx.fillStyle = '#a0aec0';
                ctx.font = 'bold 16px Outfit';
                ctx.textAlign = 'center';
                ctx.fillText(label, pegX[i], baseY + 35);
            });

            // 기둥 + 원판
            pegs.forEach((peg, i) => {
                const isSelected = selected !== null && selected.pegIdx === i;

                // 기둥
                ctx.fillStyle = isSelected ? '#73a5ff' : '#e2e8f0';
                ctx.beginPath();
                ctx.roundRect(pegX[i] - 6, baseY - pegH, 12, pegH, 6);
                ctx.fill();

                // 원판
                peg.forEach((disk, j) => {
                    const diskW = (disk / n) * maxDiskW;
                    const dy = baseY - (j + 1) * (diskH + 3);
                    const isTop = j === peg.length - 1;
                    const liftOffset = (selected && selected.pegIdx === i && isTop) ? -30 : 0;

                    // 그림자
                    ctx.fillStyle = 'rgba(0,0,0,0.08)';
                    ctx.beginPath();
                    ctx.roundRect(pegX[i] - diskW / 2 + 3, dy + liftOffset + 4, diskW, diskH - 2, 8);
                    ctx.fill();

                    // 원판 본체
                    const grad = ctx.createLinearGradient(0, dy + liftOffset, 0, dy + liftOffset + diskH);
                    grad.addColorStop(0, COLORS[(disk - 1) % COLORS.length]);
                    grad.addColorStop(1, COLORS[(disk - 1) % COLORS.length] + 'bb');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.roundRect(pegX[i] - diskW / 2, dy + liftOffset, diskW, diskH - 2, 8);
                    ctx.fill();

                    // 테두리
                    ctx.strokeStyle = isTop ? '#2d3748' : 'rgba(255,255,255,0.4)';
                    ctx.lineWidth = isTop ? 2 : 1;
                    ctx.stroke();

                    // 번호
                    ctx.fillStyle = 'white';
                    ctx.font = `bold ${Math.max(10, diskH * 0.55)}px Outfit`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(disk, pegX[i], dy + liftOffset + (diskH - 2) / 2);
                    ctx.textBaseline = 'alphabetic';
                });
            });
        }

        canvas.addEventListener('click', (e) => {
            if (autoTimer) return;

            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
            const pegX = [canvas.width / 4, canvas.width / 2, canvas.width * 3 / 4];
            const clickZone = canvas.width / 6;

            let clickedPeg = -1;
            pegX.forEach((px, i) => { if (Math.abs(mx - px) < clickZone) clickedPeg = i; });
            if (clickedPeg === -1) return;

            const feedback = document.getElementById('hanoi-feedback');

            if (selected === null) {
                if (pegs[clickedPeg].length > 0) {
                    selected = { pegIdx: clickedPeg, disk: pegs[clickedPeg][pegs[clickedPeg].length - 1] };
                    drawHanoi();
                }
            } else {
                if (clickedPeg === selected.pegIdx) {
                    selected = null;
                    drawHanoi();
                    return;
                }
                const targetPeg = pegs[clickedPeg];
                if (targetPeg.length === 0 || targetPeg[targetPeg.length - 1] > selected.disk) {
                    pegs[selected.pegIdx].pop();
                    pegs[clickedPeg].push(selected.disk);
                    moveCount++;
                    selected = null;
                    updateUI();
                    drawHanoi();
                    checkWin();
                } else {
                    feedback.style.color = '#e53e3e';
                    feedback.innerText = '❌ 큰 원판을 작은 원판 위에 올릴 수 없어요!';
                    setTimeout(() => { feedback.innerText = ''; }, 1500);
                    selected = null;
                    drawHanoi();
                }
            }
        });

        function checkWin() {
            if (pegs[2].length === n) {
                const min = Math.pow(2, n) - 1;
                const fb = document.getElementById('hanoi-feedback');
                fb.style.color = '#38a169';
                fb.innerText = moveCount === min
                    ? `🎉 완벽! 최소 횟수 ${min}번으로 클리어!`
                    : `✅ 클리어! ${moveCount}번 이동 (최소: ${min}번)`;
            }
        }

        function autoSolve() {
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
                document.getElementById('hanoi-auto-btn').innerText = '▶ 자동 풀기';
                return;
            }
            initGame();
            const moves = [];
            function solve(k, from, to, via) {
                if (k === 0) return;
                solve(k - 1, from, via, to);
                moves.push([from, to]);
                solve(k - 1, via, to, from);
            }
            solve(n, 0, 2, 1);

            let idx = 0;
            document.getElementById('hanoi-auto-btn').innerText = '⏹ 중지';
            autoTimer = setInterval(() => {
                if (idx >= moves.length) {
                    clearInterval(autoTimer);
                    autoTimer = null;
                    document.getElementById('hanoi-auto-btn').innerText = '▶ 자동 풀기';
                    checkWin();
                    return;
                }
                const [from, to] = moves[idx++];
                pegs[to].push(pegs[from].pop());
                moveCount++;
                updateUI();
                drawHanoi();
            }, Math.max(120, 600 - n * 60));
        }

        document.getElementById('hanoi-n-slider')?.addEventListener('input', function () {
            if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
            n = parseInt(this.value);
            document.getElementById('hanoi-n-val').innerText = n;
            document.getElementById('hanoi-auto-btn').innerText = '▶ 자동 풀기';
            initGame();
        });

        document.getElementById('hanoi-reset-btn')?.addEventListener('click', () => {
            if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
            document.getElementById('hanoi-auto-btn').innerText = '▶ 자동 풀기';
            initGame();
        });

        document.getElementById('hanoi-auto-btn')?.addEventListener('click', autoSolve);

        initGame();
    };
})();