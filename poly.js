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
                    [P[0], P[2], P[1]],
                    [P[0], P[1], P[3]],
                    [P[0], P[3], P[2]],
                    [P[1], P[2], P[3]],
                ];
            }
            case 'hexa': {
                const s = R / Math.sqrt(3);
                const P = [
                    V3(-s, -s, -s), V3(s, -s, -s), V3(s, s, -s), V3(-s, s, -s),
                    V3(-s, -s, s), V3(s, -s, s), V3(s, s, s), V3(-s, s, s),
                ];
                return [
                    [P[0], P[1], P[2], P[3]],
                    [P[4], P[7], P[6], P[5]],
                    [P[0], P[4], P[5], P[1]],
                    [P[2], P[6], P[7], P[3]],
                    [P[0], P[3], P[7], P[4]],
                    [P[1], P[5], P[6], P[2]],
                ];
            }
            case 'octa': {
                const P = [
                    V3(R, 0, 0), V3(-R, 0, 0),
                    V3(0, R, 0), V3(0, -R, 0),
                    V3(0, 0, R), V3(0, 0, -R),
                ];
                return [
                    [P[4], P[0], P[2]], [P[4], P[2], P[1]],
                    [P[4], P[1], P[3]], [P[4], P[3], P[0]],
                    [P[5], P[2], P[0]], [P[5], P[1], P[2]],
                    [P[5], P[3], P[1]], [P[5], P[0], P[3]],
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
                const idx = [
                    [0, 12, 13, 1, 16], [0, 8, 10, 2, 12], [0, 16, 18, 4, 8],
                    [5, 15, 14, 4, 18], [5, 9, 11, 7, 15], [5, 18, 16, 1, 9],
                    [3, 11, 9, 1, 13], [3, 17, 19, 7, 11], [3, 13, 12, 2, 17],
                    [6, 19, 17, 2, 10], [6, 14, 15, 7, 19], [6, 10, 8, 4, 14],
                ];
                return idx.map(f => f.map(i => P[i]));
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
                const idx = [
                    [0, 8, 1], [0, 4, 8], [0, 5, 4], [0, 9, 5], [0, 1, 9],
                    [3, 11, 2], [3, 7, 11], [3, 6, 7], [3, 10, 6], [3, 2, 10],
                    [1, 8, 6], [8, 10, 6], [8, 4, 10], [4, 2, 10], [4, 5, 2],
                    [5, 11, 2], [5, 9, 11], [9, 7, 11], [9, 1, 7], [1, 6, 7],
                ];
                return idx.map(f => f.map(i => P[i]));
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
                { x: 0, y: 0, rz: 0 },              // 중앙 (위 꼭짓점)
                { x: -S, y: -h, rz: Math.PI },         // 왼쪽 아래
                { x: 0, y: -h * 2, rz: 0 },           // 아래
                { x: S, y: -h, rz: Math.PI },         // 오른쪽 아래
            ];
        },

        /* 정육면체: 십자 전개도 */
        hexa: (S) => [
            { x: 0, y: S, rz: 0 },   // 위
            { x: 0, y: 0, rz: 0 },   // 앞 (중앙)
            { x: 0, y: -S, rz: 0 },   // 아래
            { x: -S, y: 0, rz: 0 },   // 왼쪽
            { x: S, y: 0, rz: 0 },   // 오른쪽
            { x: 0, y: -2 * S, rz: 0 },   // 맨 아래
        ],

        /* 정팔면체: 지그재그 띠 */
        octa: (S) => {
            const h = S * Math.sqrt(3) / 2;
            return [
                { x: -1.5 * S, y: h / 3, rz: 0 },
                { x: -S, y: -h / 3 * 2, rz: Math.PI },
                { x: -0.5 * S, y: h / 3, rz: 0 },
                { x: 0, y: -h / 3 * 2, rz: Math.PI },
                { x: 0.5 * S, y: h / 3, rz: 0 },
                { x: S, y: -h / 3 * 2, rz: Math.PI },
                { x: 1.5 * S, y: h / 3, rz: 0 },
                { x: 2 * S, y: -h / 3 * 2, rz: Math.PI },
            ];
        },

        /* 정십이면체: 꽃 모양 (중앙 오각형 + 주변 5개 + 반대쪽 6개) */
        dodeca: (S) => {
            const ap = S / (2 * Math.tan(Math.PI / 5));  // 내접원 반지름
            const d = 2 * ap;                              // 면 중심 간 거리
            const res = [];

            // 아래쪽 꽃: 중앙 + 5개 꽃잎
            res.push({ x: 0, y: -d * 1.2, rz: 0 });
            for (let k = 0; k < 5; k++) {
                const a = k * (2 * Math.PI / 5) - Math.PI / 2;
                res.push({
                    x: d * Math.cos(a),
                    y: -d * 1.2 + d * Math.sin(a),
                    rz: a + Math.PI
                });
            }

            // 위쪽 꽃: 중앙 + 5개 꽃잎 (180도 회전하여 배치)
            res.push({ x: 0, y: d * 1.2, rz: Math.PI });
            for (let k = 0; k < 5; k++) {
                const a = k * (2 * Math.PI / 5) - Math.PI / 2 + Math.PI / 5;
                res.push({
                    x: d * Math.cos(a),
                    y: d * 1.2 + d * Math.sin(a),
                    rz: a
                });
            }
            return res;
        },

        /* 정이십면체: 띠 형태 */
        icosa: (S) => {
            const h = S * Math.sqrt(3) / 2;
            const res = [];
            // 윗줄 5개 (뒤집힌 삼각형)
            for (let i = 0; i < 5; i++)
                res.push({ x: (i - 2) * S, y: h / 3, rz: Math.PI });
            // 아랫줄 5개 (정방향 삼각형)
            for (let i = 0; i < 5; i++)
                res.push({ x: (i - 2) * S + S / 2, y: -h / 3 * 2, rz: 0 });
            // 맨 윗줄 5개
            for (let i = 0; i < 5; i++)
                res.push({ x: (i - 2) * S, y: h / 3 + h, rz: 0 });
            // 맨 아랫줄 5개
            for (let i = 0; i < 5; i++)
                res.push({ x: (i - 2) * S + S / 2, y: -h / 3 * 2 - h, rz: Math.PI });
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
    /* ══════════════════════════════════════════════════════════
       도형 생성 및 전개도 목표 설정 (🌟 오류 완벽 수정본 🌟)
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
            const origQuat = new THREE.Quaternion().setFromUnitVectors(localNormal, worldOutward);
            mesh.position.copy(center);
            mesh.quaternion.copy(origQuat);

            // 2D 전개도 배치 세팅 (qRoll * qFlat)
            const qFlat = new THREE.Quaternion().setFromUnitVectors(localNormal, zAxis);
            const qRoll = new THREE.Quaternion().setFromAxisAngle(zAxis, netPos[i].rz || 0);
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

        const showDual = ['hexa', 'octa', 'dodeca', 'icosa'].includes(typeKey);
        const hint = get('poly-dual-hint');
        if (hint) hint.style.display = showDual ? 'block' : 'none';
        if (get('poly-info-f')) get('poly-info-f').style.textDecoration = showDual ? 'underline' : 'none';
        if (get('poly-info-v')) get('poly-info-v').style.textDecoration = showDual ? 'underline' : 'none';
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