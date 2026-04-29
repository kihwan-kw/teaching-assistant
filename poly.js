/* ============================================================ */
/* Polyhedron  정다면체 3D ↔ 교과서 전개도                       */
/* ============================================================ */
window.initPoly = (function () {
    let _initialized = false;
    let scene, camera, renderer, controls;
    let polyMeshGroup = new THREE.Group();
    let currentPoly = 'tetra';
    let explodeValue = 0;
    let faceData = [];

    const R = 4.5;

    /* ══════════════════════════════════════════════════════════
       각 정다면체 면(face)을 꼭짓점 배열로 직접 정의
    ══════════════════════════════════════════════════════════ */
    function getFaces(typeKey) {
        const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
        switch (typeKey) {
            case 'tetra': {
                const a = R / Math.sqrt(3);
                const P = [V3(a, a, a), V3(a, -a, -a), V3(-a, a, -a), V3(-a, -a, a)];
                return [
                    [P[0], P[1], P[2]], // 0: 중앙 (정방향 UP)
                    [P[3], P[2], P[1]], // 1: 아래쪽 (역방향 DOWN)
                    [P[1], P[0], P[3]], // 2: 왼쪽 (역방향 DOWN)
                    [P[2], P[3], P[0]], // 3: 오른쪽 (역방향 DOWN)
                ];
            }
            case 'hexa': {
                const s = R / Math.sqrt(3);
                const P = [
                    V3(-s, -s, -s), // 0: 왼쪽 아래 뒤
                    V3(s, -s, -s),  // 1: 오른쪽 아래 뒤
                    V3(s, s, -s),   // 2: 오른쪽 위 뒤
                    V3(-s, s, -s),  // 3: 왼쪽 위 뒤
                    V3(-s, -s, s),  // 4: 왼쪽 아래 앞
                    V3(s, -s, s),   // 5: 오른쪽 아래 앞
                    V3(s, s, s),    // 6: 오른쪽 위 앞
                    V3(-s, s, s),   // 7: 왼쪽 위 앞
                ];

                // 🌟 전개도의 NET_LAYOUTS 순서(0:위, 1:앞(중앙), 2:아래, 3:왼, 4:오른, 5:뒤)와 
                // 🌟 3D 면의 생성 순서를 완벽하게 1:1로 맞춥니다.
                // 주의: 꼭짓점은 겉에서 봤을 때 '반시계 방향'으로 적어야 면의 앞/뒤가 뒤집히지 않습니다.
                return [
                    [P[3], P[2], P[6], P[7]], // 0번: 위쪽 면 (Top) -> 전개도의 위쪽
                    [P[4], P[5], P[6], P[7]], // 1번: 앞쪽 면 (Front) -> 전개도의 중앙 (기준점)
                    [P[0], P[1], P[5], P[4]], // 2번: 아래쪽 면 (Bottom) -> 전개도의 아래쪽
                    [P[0], P[4], P[7], P[3]], // 3번: 왼쪽 면 (Left) -> 전개도의 왼쪽
                    [P[1], P[2], P[6], P[5]], // 4번: 오른쪽 면 (Right) -> 전개도의 오른쪽
                    [P[0], P[3], P[2], P[1]], // 5번: 뒤쪽 면 (Back) -> 전개도의 맨 아래 꼬리
                ];
            }
            case 'octa': {
                const P = [
                    V3(R, 0, 0), V3(-R, 0, 0), // 0: X, 1: -X
                    V3(0, R, 0), V3(0, -R, 0), // 2: Y, 3: -Y
                    V3(0, 0, R), V3(0, 0, -R), // 4: Z, 5: -Z
                ];
                // 중앙의 6개 띠를 기준으로 첫 조각과 마지막 조각이 위아래로 날개처럼 펼쳐지도록 
                // 3D 면의 생성 순서를 재배치했습니다.
                return [
                    [P[5], P[2], P[0]], // 0번 (▼) : 1번 조각의 "아래"에 붙는 역삼각형
                    [P[4], P[0], P[2]], // 1번 (▲) : 중앙 띠의 시작
                    [P[2], P[1], P[4]], // 2번 (▼)
                    [P[4], P[1], P[3]], // 3번 (▲)
                    [P[3], P[0], P[4]], // 4번 (▼)
                    [P[5], P[0], P[3]], // 5번 (▲)
                    [P[3], P[1], P[5]], // 6번 (▼) : 중앙 띠의 끝
                    [P[5], P[1], P[2]], // 7번 (▲) : 6번 조각의 "위"에 붙는 정삼각형
                ];
            }
            case 'dodeca': {
                const phi = (1 + Math.sqrt(5)) / 2;
                const sc = R / Math.sqrt(3);
                const a = sc, b = sc / phi, c = sc * phi;
                const P = [
                    V3(a, a, a), V3(a, a, -a), V3(a, -a, a), V3(a, -a, -a),
                    V3(-a, a, a), V3(-a, a, -a), V3(-a, -a, a), V3(-a, -a, -a),
                    V3(0, b, c), V3(0, b, -c), V3(0, -b, c), V3(0, -b, -c),
                    V3(c, 0, b), V3(c, 0, -b), V3(-c, 0, b), V3(-c, 0, -b),
                    V3(b, c, 0), V3(b, -c, 0), V3(-b, c, 0), V3(-b, -c, 0),
                ];

                // 모서리를 완벽히 공유하며 2송이의 꽃으로 펼쳐지도록 꼭짓점 순서(Winding)를 맞춘 배열
                return [
                    // --- 첫 번째 꽃 (아래쪽) ---
                    [P[0], P[12], P[13], P[1], P[16]], // 0: 중앙 1
                    [P[12], P[0], P[8], P[10], P[2]],  // 1: 0번의 1번째 모서리에 부착
                    [P[13], P[12], P[2], P[17], P[3]], // 2: 0번의 2번째 모서리에 부착
                    [P[1], P[13], P[3], P[11], P[9]],  // 3: 0번의 3번째 모서리에 부착
                    [P[16], P[1], P[9], P[5], P[18]],  // 4: 0번의 4번째 모서리에 부착
                    [P[0], P[16], P[18], P[4], P[8]],  // 5: 0번의 5번째 모서리에 부착

                    // --- 두 번째 꽃 (위쪽) ---
                    [P[6], P[14], P[15], P[7], P[19]], // 6: 중앙 2
                    [P[14], P[6], P[10], P[8], P[4]],  // 7: 6번의 1번째 모서리에 부착
                    [P[15], P[14], P[4], P[18], P[5]], // 8: 6번의 2번째 모서리에 부착
                    [P[7], P[15], P[5], P[9], P[11]],  // 9: 6번의 3번째 모서리에 부착
                    [P[19], P[7], P[11], P[3], P[17]], // 10: 6번의 4번째 모서리에 부착
                    [P[6], P[19], P[17], P[2], P[10]], // 11: 6번의 5번째 모서리에 부착
                ];
            }
            case 'icosa': {
                const phi = (1 + Math.sqrt(5)) / 2;
                const s = R / Math.sqrt(1 + phi * phi);
                const t = phi * s;
                const P = [
                    V3(0, s, t), V3(0, -s, t), V3(0, s, -t), V3(0, -s, -t),
                    V3(s, t, 0), V3(-s, t, 0), V3(s, -t, 0), V3(-s, -t, 0),
                    V3(t, 0, s), V3(-t, 0, s), V3(t, 0, -s), V3(-t, 0, -s),
                ];

                // 교과서 전개도(5-10-5 구조)에 맞춰 면이 찢어지지 않도록 꼭짓점(V0) 방향을 완벽히 맞춘 배열
                return [
                    // 0~4번: 위쪽 뚜껑 5개 (전개도에서 똑바로 선 삼각형 ▲)
                    [P[0], P[1], P[8]],  // T0
                    [P[0], P[8], P[4]],  // T1
                    [P[0], P[4], P[5]],  // T2
                    [P[0], P[5], P[9]],  // T3
                    [P[0], P[9], P[1]],  // T4

                    // 5~14번: 중앙 지그재그 띠 10개 (▼와 ▲가 교차)
                    [P[6], P[8], P[1]],  // M0 (▼)
                    [P[8], P[6], P[10]], // M1 (▲)
                    [P[10], P[4], P[8]], // M2 (▼)
                    [P[4], P[10], P[2]], // M3 (▲)
                    [P[2], P[5], P[4]],  // M4 (▼)
                    [P[5], P[2], P[11]], // M5 (▲)
                    [P[11], P[9], P[5]], // M6 (▼)
                    [P[9], P[11], P[7]], // M7 (▲)
                    [P[7], P[1], P[9]],  // M8 (▼)
                    [P[1], P[7], P[6]],  // M9 (▲)

                    // 15~19번: 아래쪽 뚜껑 5개 (전개도에서 거꾸로 매달린 삼각형 ▼)
                    [P[3], P[10], P[6]], // B0
                    [P[3], P[2], P[10]], // B1
                    [P[3], P[11], P[2]], // B2
                    [P[3], P[7], P[11]], // B3
                    [P[3], P[6], P[7]],  // B4
                ];
            }
        }
    }

    /* ══════════════════════════════════════════════════════════
       변 길이 계산
    ══════════════════════════════════════════════════════════ */
    function edgeLen(typeKey) {
        switch (typeKey) {
            case 'tetra': return R * Math.sqrt(8 / 3);
            case 'hexa': return R * 2 / Math.sqrt(3);
            case 'octa': return R * Math.sqrt(2);
            case 'dodeca': { const phi = (1 + Math.sqrt(5)) / 2; return R * 2 / (Math.sqrt(3) * phi); }
            case 'icosa': { const phi = (1 + Math.sqrt(5)) / 2; return R / Math.sqrt(1 + phi * phi) * 2; }
        }
    }

    /* ══════════════════════════════════════════════════════════
       교과서 전개도 레이아웃
       각 면의 목표 위치(x,y)와 Z축 회전각(rz)을 정의
    ══════════════════════════════════════════════════════════ */
    const NET_LAYOUTS = {
        /* 정사면체: 삼각형 1개 + 주변 3개 (나비 모양) */
        tetra: (S) => {
            const h = S * Math.sqrt(3) / 2;
            return [
                { x: 0, y: 0, rz: 0 },                  // 0: 중앙 (UP)
                { x: 0, y: -h / 3 * 2, rz: Math.PI },       // 1: 아래쪽 (DOWN)
                { x: -S / 2, y: h / 3, rz: Math.PI },       // 2: 왼쪽 (DOWN)
                { x: S / 2, y: h / 3, rz: Math.PI },        // 3: 오른쪽 (DOWN)
            ];
        },

        /* 정육면체: 십자 전개도 */
        hexa: (S) => [
            { x: 0, y: S, rz: 0 },          // 0: 위
            { x: 0, y: 0, rz: 0 },          // 1: 앞 (중앙)
            { x: 0, y: -S, rz: Math.PI },   // 2: 아래 (180도 뒤집힘 보정)
            { x: -S, y: 0, rz: -Math.PI / 2 },// 3: 왼쪽 (-90도 보정)
            { x: S, y: 0, rz: Math.PI / 2 },  // 4: 오른쪽 (90도 보정)
            { x: 0, y: -2 * S, rz: 0 },     // 5: 뒤 (맨 아래 꼬리)
        ],

        /* 정팔면체: 지그재그 띠 */
        octa: (S) => {
            const h = S * Math.sqrt(3) / 2;
            // 전체 전개도가 화면 중앙에 오도록 X축 시작점 조정
            const startX = - (5 * S / 2) / 2;

            return [
                // 0번: 1번 조각을 기준으로 '한 칸 아래(-h)'에 붙는 첫 번째 조각 (역방향 ▼)
                { x: startX, y: -h + h / 6, rz: Math.PI },

                // 1번 ~ 6번: 지그재그로 이어지는 중앙의 띠 (같은 줄 8개 탈피)
                { x: startX, y: -h / 6, rz: 0 },         // 1번 (▲)
                { x: startX + 0.5 * S, y: h / 6, rz: Math.PI },   // 2번 (▼)
                { x: startX + 1.0 * S, y: -h / 6, rz: 0 },         // 3번 (▲)
                { x: startX + 1.5 * S, y: h / 6, rz: Math.PI },   // 4번 (▼)
                { x: startX + 2.0 * S, y: -h / 6, rz: 0 },         // 5번 (▲)
                { x: startX + 2.5 * S, y: h / 6, rz: Math.PI },   // 6번 (▼)

                // 7번: 6번 조각을 기준으로 '한 칸 위(+h)'에 붙는 마지막 조각 (정방향 ▲)
                { x: startX + 2.5 * S, y: h - h / 6, rz: 0 },
            ];
        },

        /* 정십이면체: 꽃 모양 (중앙 오각형 + 주변 5개 + 반대쪽 6개) */
        dodeca: (S) => {
            const PI = Math.PI;
            const ap = S / (2 * Math.tan(PI / 5));
            const d = 2 * ap; // 맞닿은 두 정오각형 중심 간의 거리
            const res = new Array(12);

            // --- 첫 번째 꽃 (얼굴 방향) ---
            const C0 = { x: 0, y: 0 };
            res[0] = { x: C0.x, y: C0.y, rz: 0 };
            for (let j = 0; j < 5; j++) {
                const alpha = 0.7 * PI + j * 0.4 * PI;
                res[j + 1] = {
                    x: C0.x + d * Math.cos(alpha),
                    y: C0.y + d * Math.sin(alpha),
                    rz: j * 0.4 * PI - PI
                };
            }

            // --- 꽃과 꽃을 연결하는 관절(Hinge) 좌표 추적 ---
            const C3 = { x: res[3].x, y: res[3].y };
            const C9 = {
                x: C3.x + d * Math.cos(-0.3 * PI),
                y: C3.y + d * Math.sin(-0.3 * PI)
            };
            const C6 = {
                x: C9.x + d * Math.cos(-0.5 * PI),
                y: C9.y + d * Math.sin(-0.5 * PI)
            };

            // --- 두 번째 꽃 (반대 방향) ---
            res[6] = { x: C6.x, y: C6.y, rz: PI };
            for (let j = 0; j < 5; j++) {
                const beta = -0.3 * PI + j * 0.4 * PI;
                res[j + 7] = {
                    x: C6.x + d * Math.cos(beta),
                    y: C6.y + d * Math.sin(beta),
                    rz: j * 0.4 * PI
                };
            }

            // 전체 전개도가 화면 중앙에 오도록 위치 평행이동
            const ox = -C6.x / 2;
            const oy = -C6.y / 2;
            for (let i = 0; i < 12; i++) {
                res[i].x += ox;
                res[i].y += oy;
            }

            return res;
        },


        icosa: (S) => {
            const h = S * Math.sqrt(3) / 2;
            const res = [];
            // 전체 20개의 조각이 화면 중앙에 오도록 시작점(X)을 조정합니다.
            const startX = -2.25 * S;

            // 0~4번: 위쪽 뚜껑 5개 (▲, 중앙 띠의 위쪽 모서리에 부착)
            for (let i = 0; i < 5; i++) {
                res.push({ x: startX + i * S, y: h, rz: 0 });
            }

            // 5~14번: 중앙 지그재그 띠 10개 (▼와 ▲가 번갈아가며 띠 형성)
            for (let i = 0; i < 10; i++) {
                if (i % 2 === 0) {
                    // 짝수 번호 (▼)
                    res.push({ x: startX + i * S / 2, y: h / 3, rz: Math.PI });
                } else {
                    // 홀수 번호 (▲)
                    res.push({ x: startX + i * S / 2, y: 0, rz: 0 });
                }
            }

            // 15~19번: 아래쪽 뚜껑 5개 (▼, 중앙 띠의 아래쪽 모서리에 부착)
            for (let i = 0; i < 5; i++) {
                res.push({ x: startX + (i + 0.5) * S, y: -2 * h / 3, rz: Math.PI });
            }

            return res;
        },
    };

    /* ══════════════════════════════════════════════════════════
       정다면체 메타데이터
    ══════════════════════════════════════════════════════════ */
    const POLY_META = {
        tetra: { name: '정사면체', shape: '정삼각형', meet: 3, f: 4, v: 4, e: 6, color: 0x63b3ed },
        hexa: { name: '정육면체', shape: '정사각형', meet: 3, f: 6, v: 8, e: 12, color: 0x48bb78 },
        octa: { name: '정팔면체', shape: '정삼각형', meet: 4, f: 8, v: 6, e: 12, color: 0xed8936 },
        dodeca: { name: '정십이면체', shape: '정오각형', meet: 3, f: 12, v: 20, e: 30, color: 0x9f7aea },
        icosa: { name: '정이십면체', shape: '정삼각형', meet: 5, f: 20, v: 12, e: 30, color: 0xf56565 },
    };

    /* ══════════════════════════════════════════════════════════
       Three.js 초기화
    ══════════════════════════════════════════════════════════ */
    function initThreeJS() {
        const canvas = document.getElementById('polyCanvas');
        if (!canvas) return;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(0, 0, 26);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);

        // OrbitControls: Three.js r128에서는 별도 import 필요
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enablePan = false;
        }

        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const dl1 = new THREE.DirectionalLight(0xffffff, 0.55);
        dl1.position.set(10, 20, 20);
        scene.add(dl1);
        const dl2 = new THREE.DirectionalLight(0xffffff, 0.35);
        dl2.position.set(-10, -10, -10);
        scene.add(dl2);

        scene.add(polyMeshGroup);
        window.addEventListener('resize', onWindowResize);
        onWindowResize();
        animate();
    }

    function onWindowResize() {
        const canvas = document.getElementById('polyCanvas');
        if (!canvas || !renderer) return;
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        const w = wrapper.clientWidth;
        const h = Math.round(w * 0.56);
        canvas.width = w;
        canvas.height = h;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    /* ══════════════════════════════════════════════════════════
       꼭짓점 배열 → BufferGeometry (fan 삼각화)
    ══════════════════════════════════════════════════════════ */
    function makeGeo(verts) {
        const tris = [];
        for (let i = 1; i < verts.length - 1; i++) {
            tris.push(verts[0].clone(), verts[i].clone(), verts[i + 1].clone());
        }
        const arr = new Float32Array(tris.length * 3);
        tris.forEach((v, i) => {
            arr[i * 3] = v.x;
            arr[i * 3 + 1] = v.y;
            arr[i * 3 + 2] = v.z;
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        geo.computeVertexNormals();
        return geo;
    }

    /* ══════════════════════════════════════════════════════════
       도형 생성 및 전개도 목표 설정
       
       핵심 로직:
       1) 각 면의 로컬 좌표(중심 기준)로 geometry 생성
       2) origQuat: localNormal → worldOutward (3D 배치)
       3) targetQuat: 면을 XY 평면에 눕히고(localNormal → +Z) + rz 회전
       
       수정 핵심:
       - qFlat을 먼저 적용(localNormal → +Z)
       - 그 다음 qRoll 적용(Z축 기준 rz 회전)
       - 순서: targetQuat = qRoll * qFlat  (THREE.js 오른쪽부터 적용)
    ══════════════════════════════════════════════════════════ */
    function buildPolyhedron(typeKey) {
        polyMeshGroup.clear();
        faceData = [];

        const meta = POLY_META[typeKey];
        const S = edgeLen(typeKey);
        let faces = getFaces(typeKey);
        let netPos = NET_LAYOUTS[typeKey](S);

        // 🌟 [수정 1] 도형 깨짐 해결: 면의 안/밖(Winding Order) 자동 교정
        faces.forEach(faceVerts => {
            // 면의 중심점
            const center = faceVerts.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).divideScalar(faceVerts.length);
            // 두 변을 이용해 법선(Normal) 벡터 계산
            const edge1 = new THREE.Vector3().subVectors(faceVerts[1], faceVerts[0]);
            const edge2 = new THREE.Vector3().subVectors(faceVerts[2], faceVerts[0]);
            const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

            // 법선이 다면체 중심(원점)을 향한다면 꼭짓점 순서를 뒤집어 바깥을 보게 만듦
            if (normal.dot(center) < 0) {
                faceVerts.reverse();
            }
        });

        // 🌟 [수정 2] 전개도 겹침 해결: 3D 면과 2D 전개도를 Y축(높이) 기준으로 정렬하여 1:1 짝짓기
        let faceObjs = faces.map(verts => {
            return {
                verts: verts,
                center: verts.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).divideScalar(verts.length)
            };
        });

        const faceMat = new THREE.MeshPhongMaterial({
            color: meta.color,
            transparent: true,
            opacity: 0.88,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 1,
        });
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x1a365d, linewidth: 1.5 });
        const zAxis = new THREE.Vector3(0, 0, 1);

        // 정렬된 배열을 바탕으로 메쉬 생성
        faceObjs.forEach((fObj, i) => {
            if (!netPos[i]) return;

            const faceVerts = fObj.verts;
            const center = fObj.center;

            const localV = faceVerts.map(v => v.clone().sub(center));
            const edge1 = new THREE.Vector3().subVectors(localV[1], localV[0]);
            const edge2 = new THREE.Vector3().subVectors(localV[2], localV[0]);
            const localNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
            const worldOutward = center.clone().normalize();

            const geo = makeGeo(localV);
            const mesh = new THREE.Mesh(geo, faceMat.clone());
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat.clone()));

            // 3D 배치 세팅
            // 3D 배치 세팅
            const origQuat = new THREE.Quaternion().setFromUnitVectors(localNormal, worldOutward);
            mesh.position.copy(center);
            mesh.quaternion.copy(origQuat);

            // 2D 전개도 배치 세팅 (qRoll * qFlat)
            const qFlat = new THREE.Quaternion().setFromUnitVectors(localNormal, zAxis);

            // 🌟 [추가된 2D 회전 보정 코드] 🌟
            const v0_flat = localV[0].clone().applyQuaternion(qFlat);
            const faceAngle = Math.atan2(v0_flat.y, v0_flat.x);

            // 기본적으로 다각형의 첫 꼭짓점이 12시(90도) 방향을 보도록 기준을 잡음
            let baseAngle = Math.PI / 2;
            // 정육면체(사각형)일 경우에만 대각선(45도) 방향으로 기준 변경
            if (typeKey === 'hexa') baseAngle = Math.PI / 4;

            const correctionAngle = baseAngle - faceAngle;
            const finalRz = (netPos[i].rz || 0) + correctionAngle;

            // 수정된 finalRz 각도를 적용
            const qRoll = new THREE.Quaternion().setFromAxisAngle(zAxis, finalRz);
            const targetQuat = new THREE.Quaternion().multiplyQuaternions(qRoll, qFlat);

            polyMeshGroup.add(mesh);
            faceData.push({
                mesh,
                origPos: center.clone(),
                origQuat: origQuat.clone(),
                targetPos: new THREE.Vector3(netPos[i].x, netPos[i].y, 0),
                targetQuat: targetQuat.clone(),
            });
        });

        camera.position.set(0, 0, typeKey === 'icosa' ? 30 : 26);
        if (controls) {
            controls.target.set(0, 0, 0);
            controls.update();
        }
        updatePolyInfo(typeKey);
        updateExplosion();
    }

    /* ══════════════════════════════════════════════════════════
       3D ↔ 전개도 모핑 (슬라이더 0 → 1)
    ══════════════════════════════════════════════════════════ */
    function updateExplosion() {
        const t = explodeValue;
        /* easeInOut: 시작/끝을 부드럽게 */
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        faceData.forEach(fd => {
            fd.mesh.position.lerpVectors(fd.origPos, fd.targetPos, ease);
            fd.mesh.quaternion.slerpQuaternions(fd.origQuat, fd.targetQuat, ease);
            /* 전개도가 될수록 약간 투명하게 */
            fd.mesh.material.opacity = 0.88 - ease * 0.15;
        });

        /* 전개도 상태(t > 0.9)에서는 자동 회전 정지 */
        if (ease > 0.9) {
            polyMeshGroup.rotation.set(0, 0, 0);
        }
    }

    /* ══════════════════════════════════════════════════════════
       정보 패널 업데이트
    ══════════════════════════════════════════════════════════ */
    function updatePolyInfo(typeKey) {
        const d = POLY_META[typeKey];
        const get = id => document.getElementById(id);

        if (get('poly-name-title')) get('poly-name-title').innerText = d.name;
        if (get('poly-info-shape')) get('poly-info-shape').innerText = d.shape;
        if (get('poly-info-meet')) get('poly-info-meet').innerText = d.meet + '개';
        if (get('poly-info-f')) get('poly-info-f').innerText = d.f;
        if (get('poly-info-v')) get('poly-info-v').innerText = d.v;
        if (get('poly-info-e')) get('poly-info-e').innerText = d.e;

        if (get('poly-info-f')) get('poly-info-f').style.textDecoration = 'none';
        if (get('poly-info-v')) get('poly-info-v').style.textDecoration = 'none';
    }

    /* ══════════════════════════════════════════════════════════
       렌더 루프
    ══════════════════════════════════════════════════════════ */
    function animate() {
        requestAnimationFrame(animate);

        if (controls) controls.update();
        renderer.render(scene, camera);
    }

    /* ══════════════════════════════════════════════════════════
       공개 초기화
    ══════════════════════════════════════════════════════════ */
    return function () {
        if (_initialized) { onWindowResize(); return; }
        _initialized = true;

        initThreeJS();

        // 전개도 토글 상태 관리
        let isUnfolded = false;
        let animationFrameId = null;
        const toggleBtn = document.getElementById('poly-toggle-btn');

        /* 정다면체 선택 버튼 */
        document.querySelectorAll('.poly-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('.poly-btn').forEach(b => {
                    b.classList.remove('active');
                });

                e.target.classList.add('active');
                currentPoly = e.target.dataset.type;

                // [수정] 다른 도형 선택 시 입체로 초기화
                isUnfolded = false;
                if (toggleBtn) {
                    toggleBtn.innerText = "전개도 보기 (2D)";
                    toggleBtn.style.background = "#3182ce"; // 파란색
                }
                if (animationFrameId) cancelAnimationFrame(animationFrameId);

                explodeValue = 0;
                buildPolyhedron(currentPoly);
            });
        });

        /* [수정] 버튼 클릭 시 3D ↔ 전개도 부드러운 전환 애니메이션 */
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                isUnfolded = !isUnfolded; // 상태 반전

                // 버튼 텍스트 및 색상 변경
                toggleBtn.innerText = isUnfolded ? "겨냥도 보기 (3D)" : "전개도 보기 (2D)";
                toggleBtn.style.background = isUnfolded ? "#e53e3e" : "#3182ce";

                const targetValue = isUnfolded ? 1 : 0;
                const startValue = explodeValue;
                const duration = 500; // 애니메이션 진행 시간 (0.5초)
                const startTime = performance.now();

                // 진행 중인 애니메이션이 있으면 취소
                if (animationFrameId) cancelAnimationFrame(animationFrameId);

                // 부드러운 변형 함수
                function animateUnfold(time) {
                    let progress = (time - startTime) / duration;
                    if (progress > 1) progress = 1;

                    // updateExplosion 내부에 자체 easeInOut 로직이 있으므로 시간은 선형 증가
                    explodeValue = startValue + (targetValue - startValue) * progress;

                    updateExplosion();

                    if (progress < 1) {
                        animationFrameId = requestAnimationFrame(animateUnfold);
                    }
                }
                animationFrameId = requestAnimationFrame(animateUnfold);
            });
        }

        buildPolyhedron('tetra');
    };
})();