// seq_sum2_3d.js - 3D Visualization of Sum of Squares (Σk²)
(function () {
    let scene, camera, renderer, controls;
    let groupA, groupB, groupC, pivotGroup;
    let topBlocks = [];
    let currentN = 4;
    
    let p1 = 0, p1_target = 0;
    let p2 = 0, p2_target = 0;
    let animReq = null;
    let isInitialized = false;

    function initThree(canvas) {
        if (isInitialized) return;
        isInitialized = true;
        
        scene = new THREE.Scene();
        scene.background = null; 

        camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, 0.1, 100);
        camera.position.set(15, 12, 18);

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(canvas.width, canvas.height);
        renderer.setPixelRatio(window.devicePixelRatio);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 0, 0);

        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(10, 20, 15);
        scene.add(dirLight);
        
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight2.position.set(-10, 10, -15);
        scene.add(dirLight2);

        pivotGroup = new THREE.Group();
        scene.add(pivotGroup);

        animateLoop();
    }

    function buildPyramids(n) {
        currentN = n;
        pivotGroup.clear();
        topBlocks = [];

        groupA = new THREE.Group();
        groupB = new THREE.Group();
        groupC = new THREE.Group();

        pivotGroup.add(groupA);
        pivotGroup.add(groupB);
        pivotGroup.add(groupC);

        const colorA = 0xd45c7a;
        const colorB = 0x5097b8;
        const colorC = 0x4db48e;

        const matA = new THREE.MeshPhongMaterial({ color: colorA, flatShading: false, shininess: 30 });
        const matB = new THREE.MeshPhongMaterial({ color: colorB, flatShading: false, shininess: 30 });
        const matC = new THREE.MeshPhongMaterial({ color: colorC, flatShading: false, shininess: 30 });
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });

        const geomHalf = new THREE.BoxGeometry(1, 0.5, 1);
        const edgesHalf = new THREE.EdgesGeometry(geomHalf);

        function createHalf(x, y, z, mat, isTop, group) {
            const mesh = new THREE.Mesh(geomHalf, mat);
            mesh.position.set(x + 0.5, y + (isTop ? 0.75 : 0.25), z + 0.5);
            
            const line = new THREE.LineSegments(edgesHalf, edgeMat);
            mesh.add(line);
            
            if (isTop) {
                mesh.userData = {
                    isTop: true,
                    logicalY: y,
                    origPos: mesh.position.clone(),
                    // Cut animation target: slide to empty space (Z-1, Y, X) and drop by 0.5
                    targetPos: new THREE.Vector3((z - 1) + 0.5, y + 0.25, x + 0.5)
                };
                topBlocks.push(mesh);
            }
            group.add(mesh);
        }

        for (let u = 0; u < n; u++) {
            for (let v = 0; v < n; v++) {
                for (let w = 0; w <= Math.min(u, v); w++) {
                    // Triangle A (Pink)
                    createHalf(u, v, w, matA, false, groupA);
                    createHalf(u, v, w, matA, true, groupA);

                    // Triangle B (Sky Blue)
                    createHalf(u, w, v + 1, matB, false, groupB);
                    createHalf(u, w, v + 1, matB, true, groupB);

                    // Triangle C (Mint)
                    createHalf(w, u + 1, v + 1, matC, false, groupC);
                    createHalf(w, u + 1, v + 1, matC, true, groupC);
                }
            }
        }

        const spacing = n * 1.5;
        groupA.userData.scatterPos = new THREE.Vector3(-spacing, 0, 0);
        groupA.userData.scatterRot = new THREE.Euler(-Math.PI/2, 0, 0);

        groupB.userData.scatterPos = new THREE.Vector3(spacing, 0, spacing*0.5);
        groupB.userData.scatterRot = new THREE.Euler(0, -Math.PI/4, 0);

        groupC.userData.scatterPos = new THREE.Vector3(0, 0, -spacing);
        groupC.userData.scatterRot = new THREE.Euler(0, Math.PI, Math.PI/2);

        // Center the assembled block
        pivotGroup.position.set(-n / 2.0, -n / 2.0, -(n + 1) / 2.0);

        p1 = p1_target;
        p2 = p2_target;
        updateMeshes();
    }

    function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    function updateMeshes() {
        if (!groupA) return;
        const t1 = easeInOutCubic(p1);
        
        [groupA, groupB, groupC].forEach(g => {
            const qScatter = new THREE.Quaternion().setFromEuler(g.userData.scatterRot);
            const qMerge = new THREE.Quaternion(); // Identity
            g.quaternion.slerpQuaternions(qScatter, qMerge, t1);
            g.position.lerpVectors(g.userData.scatterPos, new THREE.Vector3(0,0,0), t1);
        });

        const t2 = easeInOutCubic(p2);
        topBlocks.forEach(b => {
            if (b.userData.logicalY === currentN) { // only animate the highest layer
                b.position.lerpVectors(b.userData.origPos, b.userData.targetPos, t2);
            }
        });
    }

    function animateLoop() {
        animReq = requestAnimationFrame(animateLoop);
        
        let changed = false;
        const speed = 0.04;
        
        if (Math.abs(p1_target - p1) > 0.001) {
            p1 += (p1_target - p1) * speed * (p1_target > p1 ? 1 : 1.5);
            changed = true;
        } else { p1 = p1_target; }
        
        if (Math.abs(p2_target - p2) > 0.001) {
            p2 += (p2_target - p2) * speed * (p2_target > p2 ? 1 : 1.5);
            changed = true;
        } else { p2 = p2_target; }

        if (changed) updateMeshes();
        
        if (controls) controls.update();
        if (renderer && scene && camera) renderer.render(scene, camera);
    }

    window.initSum2_3D = function(canvas, slider, nValElem, fbElem) {
        initThree(canvas);

        const btnMerge = document.getElementById('seq2-btn-merge');
        const btnCut = document.getElementById('seq2-btn-cut');
        const btnReset = document.getElementById('seq2-btn-reset');

        function updateFeedback() {
            if (!fbElem) return;
            const n = currentN;
            const sum = n * (n + 1) * (2 * n + 1) / 6;
            
            let html = `<span class="seq-fb-big">1² + 2² + ··· + ${n}² = ${sum}</span><br>`;
            if (p1_target === 0) {
                html += `<span class="seq-fb-sub">3개의 피라미드의 부피 = 3 × Σk²</span>`;
            } else if (p2_target === 0) {
                html += `<span class="seq-fb-sub">위가 울퉁불퉁한 퍼즐 완성! <span style="color:#d45c7a">■</span><span style="color:#5097b8">■</span><span style="color:#4db48e">■</span></span>`;
            } else {
                html += `<span class="seq-fb-sub" style="font-size:15px">튀어나온 반칸을 잘라 빈 곳을 채우면 완벽한 ${n}×${n+1}×(${n}+½) 직육면체 완성!<br>`;
                html += `<strong style="color:#e53e3e; font-size:16px; display:inline-block; margin-top:5px;">3 × Σk² = ${n}(${n+1})(n+½)  ⇒  Σk² = n(n+1)(2n+1) / 6</strong></span>`;
            }
            fbElem.innerHTML = html;
        }

        slider.addEventListener('input', () => {
            const val = parseInt(slider.value);
            if (nValElem) nValElem.textContent = val;
            buildPyramids(val);
            updateFeedback();
        });

        if (btnMerge) {
            btnMerge.addEventListener('click', () => {
                p1_target = 1; p2_target = 0;
                updateFeedback();
            });
        }
        if (btnCut) {
            btnCut.addEventListener('click', () => {
                p1_target = 1; p2_target = 1;
                updateFeedback();
            });
        }
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                p1_target = 0; p2_target = 0;
                updateFeedback();
            });
        }

        buildPyramids(parseInt(slider.value) || 4);
        updateFeedback();
        
        // Resize observer
        const observer = new ResizeObserver(() => {
            if (!renderer) return;
            const rect = canvas.parentElement.getBoundingClientRect();
            // match the canvas dimensions to parent wrapper
            canvas.width = rect.width;
            canvas.height = rect.height || rect.width * 0.58;
            renderer.setSize(canvas.width, canvas.height, false);
            camera.aspect = canvas.width / canvas.height;
            camera.updateProjectionMatrix();
        });
        observer.observe(canvas.parentElement);
    };
})();
