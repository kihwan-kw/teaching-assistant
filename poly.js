/* ========================================================= */
/* --- Polyhedron (정다면체 3D ↔ 2D 교과서 전개도 완벽 매칭) --- */
/* ========================================================= */

window.initPoly = (function () {
    let _initialized = false;

    let scene, camera, renderer, controls;
    let polyMeshGroup = new THREE.Group();

    let currentPoly = 'tetra';
    let explodeValue = 0;
    let faceData = [];

    // 🌟 교과서 전개도 모양에 맞춘 2D 평면 절대 좌표 하드코딩 (x, y, z회전각)
    // S: 한 변의 길이에 비례하는 스케일 값
    const NET_LAYOUTS = {
        'tetra': (S) => {
            const h = S * Math.sqrt(3) / 2, r = h / 3;
            // 1.중앙(0도), 2.위(180도 뒤집힘), 3.좌하단, 4.우하단
            return [
                { x: 0, y: 0, rz: 0 },
                { x: 0, y: 2 * r, rz: Math.PI },
                { x: -S / 2, y: -r, rz: Math.PI },
                { x: S / 2, y: -r, rz: Math.PI }
            ];
        },
        'hexa': (S) => {
            // 십자가 모양: 1.중앙, 2.위, 3.아래, 4.좌, 5.우, 6.우우(꼬리)
            return [
                { x: 0, y: 0, rz: 0 }, { x: 0, y: S, rz: 0 }, { x: 0, y: -S, rz: 0 },
                { x: -S, y: 0, rz: 0 }, { x: S, y: 0, rz: 0 }, { x: 2 * S, y: 0, rz: 0 }
            ];
        },
        'octa': (S) => {
            const h = S * Math.sqrt(3) / 2, r = h / 3;
            let p = [];
            // 평행사변형 모양 8개 지그재그 나열
            for (let i = 0; i < 4; i++) {
                p.push({ x: i * S - 1.5 * S, y: -r, rz: 0 });
                p.push({ x: i * S - 1.5 * S + S / 2, y: r, rz: Math.PI });
            }
            return p;
        },
        'dodeca': (S) => {
            // 정오각형 중심에서 꼭짓점까지의 거리 a
            const a = S / (2 * Math.sin(Math.PI / 5));
            const h = a * Math.cos(Math.PI / 5); // 중심에서 변까지 수직 거리
            let p = [];
            // 두 개의 꽃(Flower) 모양이 연결된 형태
            [{ cx: -2.3 * h, cy: 0 }, { cx: 2.3 * h, cy: 0 }].forEach(c => {
                p.push({ x: c.cx, y: c.cy, rz: 0 }); // 중앙 1개
                for (let i = 0; i < 5; i++) { // 주변 5개 잎사귀
                    const ang = i * 72 * Math.PI / 180;
                    // 오각형의 중심간 거리는 2 * h
                    p.push({ x: c.cx + 2 * h * Math.sin(ang), y: c.cy + 2 * h * Math.cos(ang), rz: Math.PI });
                }
            });
            return p;
        },
        'icosa': (S) => {
            const h = S * Math.sqrt(3) / 2, r = h / 3;
            let p = [];
            // 중앙 10개 지그재그
            for (let i = 0; i < 5; i++) { p.push({ x: i * S - 2 * S, y: -r, rz: 0 }); p.push({ x: i * S - 2 * S + S / 2, y: r, rz: Math.PI }); }
            // 위쪽 날개 5개
            for (let i = 0; i < 5; i++) p.push({ x: i * S - 2 * S, y: 3 * r, rz: Math.PI });
            // 아래쪽 날개 5개
            for (let i = 0; i < 5; i++) p.push({ x: i * S - 2 * S + S / 2, y: -3 * r, rz: 0 });
            return p;
        }
    };

    const POLY_DATA = {
        'tetra': { name: '정사면체', shape: '정삼각형', meet: 3, f: 4, v: 4, e: 6, color: 0x63b3ed, geo: () => new THREE.TetrahedronGeometry(4.5), scale: 6.8 },
        'hexa': { name: '정육면체', shape: '정사각형', meet: 3, f: 6, v: 8, e: 12, color: 0x48bb78, geo: () => new THREE.BoxGeometry(4.5, 4.5, 4.5), scale: 4.5 },
        'octa': { name: '정팔면체', shape: '정삼각형', meet: 4, f: 8, v: 6, e: 12, color: 0xed8936, geo: () => new THREE.OctahedronGeometry(4.5), scale: 5.5 },
        'dodeca': { name: '정십이면체', shape: '정오각형', meet: 3, f: 12, v: 20, e: 30, color: 0x9f7aea, geo: () => new THREE.DodecahedronGeometry(4.0), scale: 3.5 },
        'icosa': { name: '정이십면체', shape: '정삼각형', meet: 5, f: 20, v: 12, e: 30, color: 0xf56565, geo: () => new THREE.IcosahedronGeometry(4.5), scale: 3.5 }
    };

    function initThreeJS() {
        const canvas = document.getElementById('polyCanvas');
        if (!canvas) return;

        scene = new THREE.Scene();
        // 카메라를 Z축에서 내려다보게 설정 (전개도가 바닥에 펼쳐지므로)
        camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
        camera.position.set(0, 0, 24);

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(canvas.width, canvas.height);
        renderer.setPixelRatio(window.devicePixelRatio);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dl1 = new THREE.DirectionalLight(0xffffff, 0.6); dl1.position.set(10, 20, 20); scene.add(dl1);
        const dl2 = new THREE.DirectionalLight(0xffffff, 0.4); dl2.position.set(-10, -10, -10); scene.add(dl2);

        scene.add(polyMeshGroup);
        window.addEventListener('resize', onWindowResize);
        animate();
    }

    function onWindowResize() {
        const canvas = document.getElementById('polyCanvas');
        const wrapper = canvas.parentElement;
        if (!wrapper || !renderer) return;
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientWidth * 0.55;
        renderer.setSize(canvas.width, canvas.height, false);
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
    }

    // Three.js의 Geometry에서 각 다각형(면)을 뜯어내는 함수
    function extractPolygons(geometry) {
        const pos = geometry.attributes.position;
        const faces = [];

        // 삼각형들을 법선(Normal) 기준으로 묶어서 다각형(사각형, 오각형 등)으로 합침
        for (let i = 0; i < pos.count; i += 3) {
            const vA = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            const vB = new THREE.Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
            const vC = new THREE.Vector3(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));

            const normal = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(vC, vB), new THREE.Vector3().subVectors(vA, vB)).normalize();
            const center = new THREE.Vector3().addVectors(vA, vB).add(vC).divideScalar(3);

            let added = false;
            for (let f of faces) {
                // 법선 벡터가 거의 같으면 같은 면으로 취급
                if (f.normal.angleTo(normal) < 0.1) {
                    f.verts.push(vA, vB, vC);
                    f.centerSum.add(center);
                    f.triCount++;
                    added = true; break;
                }
            }
            if (!added) faces.push({ normal, centerSum: center.clone(), verts: [vA, vB, vC], triCount: 1 });
        }

        // 각 면의 최종 중심점 계산
        faces.forEach(f => f.center = f.centerSum.divideScalar(f.triCount));
        return faces;
    }

    function buildPolyhedron(typeKey) {
        polyMeshGroup.clear();
        faceData = [];

        const data = POLY_DATA[typeKey];
        // nonIndexed 지오메트리를 써야 면을 쪼개기 쉽습니다.
        let geometry = data.geo().toNonIndexed();
        geometry.computeVertexNormals();

        const mat = new THREE.MeshPhongMaterial({ color: data.color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1 });
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x2d3748, linewidth: 2 });

        const polygons = extractPolygons(geometry);
        const netPositions = NET_LAYOUTS[typeKey](data.scale);

        // 뽑아낸 각 다각형 면(Mesh)을 독립적인 객체로 생성
        polygons.forEach((f, i) => {
            // 꼭짓점들을 중심 기준으로 원점으로 정렬 (자체 회전을 위해)
            f.verts.forEach(v => v.sub(f.center));
            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array(f.verts.length * 3);
            f.verts.forEach((v, idx) => { positions[idx * 3] = v.x; positions[idx * 3 + 1] = v.y; positions[idx * 3 + 2] = v.z; });
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.computeVertexNormals();

            const mesh = new THREE.Mesh(geo, mat);
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));

            // 1. 3D 입체도형 상태일 때의 원본 위치 및 회전
            mesh.position.copy(f.center);
            const origQuat = new THREE.Quaternion();

            // 2. 2D 전개도 상태일 때의 목표 위치 및 회전 계산
            // 카메라를 바라보도록(Z축 평행) 법선 회전 후, 전개도 디자인에 맞게 Z축 추가 회전
            const qAlign = new THREE.Quaternion().setFromUnitVectors(f.normal, new THREE.Vector3(0, 0, 1));
            const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), netPositions[i].rz || 0);
            const targetQuat = qAlign.clone().premultiply(qRoll);

            // 정십이면체의 경우, 중심점(0,0)에 맞게 잎사귀 오각형들을 방사형으로 돌려줌
            if (typeKey === 'dodeca' && i !== 0 && i !== 6) {
                const ang = ((i % 6) - 1) * 72 * Math.PI / 180;
                targetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -ang));
            }

            polyMeshGroup.add(mesh);
            faceData.push({
                mesh: mesh,
                origPos: f.center.clone(),
                origQuat: origQuat,
                targetPos: new THREE.Vector3(netPositions[i].x, netPositions[i].y, 0),
                targetQuat: targetQuat
            });
        });

        // 뷰 초기화 (도형 크기에 따라 카메라 거리 조절)
        camera.position.set(0, 0, typeKey === 'icosa' ? 26 : 22);
        controls.target.set(0, 0, 0);

        updatePolyInfo(typeKey);
        updateExplosion();
    }

    // 🌟 핵심 애니메이션 (3D ↔ 2D 모핑)
    function updateExplosion() {
        const t = explodeValue;
        // 촥! 펼쳐지는 느낌을 위한 부드러운 이징(Easing)
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        faceData.forEach(face => {
            // 각 면이 3D 원본 위치에서 2D 바닥(z=0)의 전개도 위치로 부드럽게 이동하고 회전합니다.
            face.mesh.position.lerpVectors(face.origPos, face.targetPos, ease);
            face.mesh.quaternion.slerpQuaternions(face.origQuat, face.targetQuat, ease);

            // 전개도로 펴질수록 투명해져서 안쪽 선이 안 겹쳐보이게 처리
            face.mesh.material.opacity = 0.9 - (ease * 0.1);
        });
    }

    function updatePolyInfo(typeKey) {
        const data = POLY_DATA[typeKey];
        document.getElementById('poly-name-title').innerText = data.name;
        document.getElementById('poly-info-shape').innerText = data.shape;
        document.getElementById('poly-info-meet').innerText = data.meet + "개";
        document.getElementById('poly-info-f').innerText = data.f;
        document.getElementById('poly-info-v').innerText = data.v;
        document.getElementById('poly-info-e').innerText = data.e;

        // 쌍대 다면체(크로스) 하이라이트 팁
        const dualHint = document.getElementById('poly-dual-hint');
        if (typeKey === 'hexa' || typeKey === 'octa' || typeKey === 'dodeca' || typeKey === 'icosa') {
            dualHint.style.display = 'block';
            document.getElementById('poly-info-f').style.textDecoration = 'underline';
            document.getElementById('poly-info-v').style.textDecoration = 'underline';
        } else {
            dualHint.style.display = 'none';
            document.getElementById('poly-info-f').style.textDecoration = 'none';
            document.getElementById('poly-info-v').style.textDecoration = 'none';
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        // 3D 상태일 때만 빙글빙글 돌고, 슬라이더를 당겨 전개도로 펼치면 회전이 딱 멈춰서 정면을 보여줍니다!
        if (explodeValue < 0.05 && !controls.state) {
            polyMeshGroup.rotation.y += 0.005;
            polyMeshGroup.rotation.x += 0.003;
        } else if (explodeValue >= 0.05) {
            polyMeshGroup.rotation.set(0, 0, 0);
        }
        controls.update();
        renderer.render(scene, camera);
    }

    return function () {
        if (_initialized) { onWindowResize(); return; }
        _initialized = true;

        initThreeJS();

        // 정다면체 5개 버튼 클릭 이벤트
        document.querySelectorAll('.poly-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.poly-btn').forEach(b => b.classList.remove('active', 'custom-active'));
                e.target.classList.add('active');
                e.target.style.backgroundColor = '#ebf8ff'; e.target.style.color = '#3182ce'; e.target.style.borderColor = '#63b3ed';

                document.querySelectorAll('.poly-btn:not(.active)').forEach(b => {
                    b.style.backgroundColor = ''; b.style.color = ''; b.style.borderColor = '';
                });

                currentPoly = e.target.dataset.type;

                // 도형 바꿀 때 슬라이더 초기화 (입체 상태로)
                document.getElementById('poly-explode-slider').value = 0;
                explodeValue = 0;
                buildPolyhedron(currentPoly);
            });
        });

        // 해체(전개도) 슬라이더 이벤트
        document.getElementById('poly-explode-slider').addEventListener('input', (e) => {
            explodeValue = parseInt(e.target.value) / 100;
            updateExplosion();
        });

        // 초기 시작 시 정사면체 띄우기
        buildPolyhedron('tetra');
        onWindowResize();
    };
})();