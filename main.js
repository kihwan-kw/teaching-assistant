/* ========================================================= */
/* --- Main (메인 진입점 & 홈 화면 + 단원별 인덱스 제어) --- */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // 🌟 1. 각 단원별 튜토리얼 내용 정의 🌟
    const TUTORIAL_DATA = {
        'exp': {
            icon: '📈', title: '그래프 그리기', desc: '함수를 직접 입력하고 어떻게 변하는지 관찰해 보세요.',
            items: ['수식을 입력하고 <strong>[추가하기]</strong>를 누르세요.', '우측 <strong>캔버스를 마우스로 드래그</strong>하여 화면을 이동할 수 있습니다.', '마우스 <strong>휠을 돌려 확대/축소(Zoom)</strong>가 가능합니다.', '대칭/평행 이동 버튼을 눌러 그래프의 변화를 확인하세요.']
        },
        'factor': {
            icon: '✖️', title: '인수분해 훈련소', desc: '직접 숫자를 채워 넣으며 인수분해 원리를 체화합니다.',
            items: ['좌측 탭에서 <strong>훈련하고 싶은 단계</strong>를 선택하세요.', '빈칸을 클릭한 후, <strong>미니 키패드</strong>나 키보드로 정답을 입력하세요.', '모르겠을 땐 <strong>[💡 힌트]</strong> 버튼을 적극 활용하세요!', '무한 퀴즈 탭에서 콤보를 쌓아 최고 점수에 도전해 보세요.']
        },
        'matrix': {
            icon: '🔲', title: '행렬과 변환', desc: '행렬이 공간을 어떻게 찌그러뜨리고 회전시키는지 눈으로 확인합니다.',
            items: ['이미지를 업로드하거나 기본 도형을 사용하세요.', '<strong>변환 행렬 a, b, c, d</strong> 값을 직접 조절해 보세요.', '행렬식(det)이 0이 되면 어떻게 되는지 관찰하세요.', '<strong>[▶ 변환 애니메이션]</strong>을 누르면 공간이 휘어지는 과정을 볼 수 있습니다.']
        },
        'trig': {
            icon: '〽️', title: '삼각함수', desc: '원 위를 도는 점이 어떻게 파동(그래프)을 만들어내는지 이해합니다.',
            items: ['<strong>각도 슬라이더</strong>를 좌우로 움직여 보세요.', '호도법 탭에서는 <strong>반지름과 호의 길이 비례 관계</strong>를 확인합니다.', '사인, 코사인, 탄젠트 탭에서 <strong>수선의 발</strong>이 어떻게 그래프가 되는지 관찰하세요.']
        },
        'integ': {
            icon: '∫', title: '적분 (구분구적법)', desc: '직사각형을 무한히 잘게 쪼개면 어떻게 되는지 확인합니다.',
            items: ['함수식을 입력하고 <strong>적분 구간 [a, b]</strong>를 설정하세요.', '<strong>분할 횟수 n 슬라이더</strong>를 최대로 당겨보세요.', '상합(Upper)과 하합(Lower)의 차이가 어떻게 0이 되는지(조임정리) 관찰하세요.']
        },
        'quad': { // (추가하신 이차함수)
            icon: '🎢', title: '이차함수의 모든 것', desc: '포물선을 직접 이리저리 끌고 다니며 원리를 파악하세요.',
            items: ['평행이동 탭에서 <strong>꼭짓점을 마우스로 잡고 드래그</strong>해 보세요.', '최대·최소 탭에서 <strong>파란색/빨간색 세로 경계선</strong>을 잡고 움직여 보세요.', '판별식 탭에서 c값을 조절하며 <strong>포물선이 수면(x축)에 닿는 순간</strong>을 찾아보세요.']
        },
        'seq': {
            icon: '🔢', title: '시그마 테트리스', desc: '거듭제곱의 합 공식을 아름다운 퍼즐로 증명합니다.',
            items: [
                '<strong>N 슬라이더</strong>를 올려 블록을 쌓아보세요.',
                '<strong>[▶ 애니메이션 실행]</strong>을 눌러 퍼즐이 어떻게 조립되는지 감상하세요.',
                '특히 <strong>세제곱의 합(Σk³)</strong> 탭에서 마법 같은 정사각형 조립 과정을 꼭 확인하세요!',
                '<strong>하노이탑</strong> 탭에서 직접 원판을 옮기며 최소 이동 횟수 <strong>2ⁿ−1</strong>이 왜 나오는지 체험해 보세요.'
            ]
        },
        'deriv': {
            icon: '📐', title: '미분의 본질', desc: '두 점 사이의 거리가 0이 되는 극한의 마법을 봅니다.',
            items: ['<strong>할선 간격 h 슬라이더</strong>를 0에 가깝게 줄여보세요.', '주황색 할선(평균변화율)이 분홍색 접선(순간변화율)으로 바뀌는 것을 관찰하세요.', '원함수 위의 점을 움직여 <strong>아래쪽 도함수 그래프</strong>가 그려지는 것을 확인하세요.']
        },
        'poly': {
            icon: '💎', title: '정다면체의 입체와 전개도', desc: '5가지 정다면체를 직접 돌려보고 전개도로 펼쳐보세요.',
            items: [
                '좌측에서 <strong>정다면체를 선택</strong>하세요.',
                '캔버스를 <strong>마우스로 드래그</strong>하여 입체를 회전시켜 보세요.',
                '<strong>[전개도 보기]</strong> 버튼을 누르면 입체가 평면으로 펼쳐집니다.',
                '면·꼭짓점·모서리 개수로 <strong>오일러 공식(V - E + F = 2)</strong>을 확인해 보세요.'
            ]
        },
        'prob': {
            icon: '🎲', title: '확률과 통계', desc: '파스칼의 삼각형부터 정규분포까지, 확률의 비밀을 탐험합니다.',
            items: [
                '<strong>파스칼</strong> 탭에서 삼각형의 숫자에 마우스를 올려 수학적 패턴을 발견하세요.',
                '<strong>몬티홀</strong> 탭에서 직접 문을 고르고, 1000번 시뮬레이션으로 직관과 수학을 비교해 보세요.',
                '<strong>갈톤보드</strong> 탭에서 공을 많이 떨어뜨릴수록 막대그래프가 정규분포 곡선에 가까워지는 것을 관찰하세요.',
                '<strong>정규분포</strong> 탭에서 μ와 σ 슬라이더로 종 모양 곡선이 어떻게 변하는지 확인하세요.'
            ]
        },
        'geom': {
            icon: '🌀', title: '기하', desc: '이차곡선, 벡터, 공간도형을 시각적으로 탐구합니다.',
            items: [
                '<strong>이차곡선</strong> 탭에서 포물선, 타원, 쌍곡선의 정의와 성질을 확인하세요.',
                '<strong>벡터</strong> 탭에서 벡터의 덧셈, 뺄셈, 내적을 시각적으로 이해하세요.',
                '<strong>공간도형</strong> 탭에서 3차원 공간에서의 직선과 평면의 관계를 살펴보세요.'
            ]
        }
    };

    // 🌟 2. 팝업 제어 로직 🌟
    const modal = document.getElementById('tutorial-modal');
    const closeBtn = document.getElementById('tutorial-close-btn');
    const dontShowChk = document.getElementById('tutorial-dont-show');
    let currentTutorialUnit = '';

    function showTutorial(unitId) {
        // 이미 '다시 보지 않기'를 체크한 단원이면 패스
        if (localStorage.getItem(`hide_tutorial_${unitId}`) === 'true') return;

        const data = TUTORIAL_DATA[unitId];
        if (!data) return; // 데이터가 없는 단원이면 패스

        currentTutorialUnit = unitId;
        document.getElementById('tutorial-icon').innerText = data.icon;
        document.getElementById('tutorial-title').innerText = data.title;
        document.getElementById('tutorial-desc').innerText = data.desc;

        const listUl = document.getElementById('tutorial-list');
        listUl.innerHTML = '';
        data.items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = item;
            listUl.appendChild(li);
        });

        dontShowChk.checked = false; // 체크박스 초기화
        modal.style.display = 'flex';
    }

    closeBtn.addEventListener('click', () => {
        if (dontShowChk.checked && currentTutorialUnit) {
            // 브라우저 로컬 스토리지에 저장하여 다음 방문 시 안 띄움
            localStorage.setItem(`hide_tutorial_${currentTutorialUnit}`, 'true');
        }
        modal.style.display = 'none';
    });

    const UNITS = [
        { id: 'poly', icon: '💎', title: '정다면체', subtitle: '5가지 정다면체의 입체와 성질', ready: true, colorClass: 'card-trig', init: () => window.initPoly() },
        { id: 'exp', icon: '📈', title: '그래프 그리기', subtitle: '함수를 입력하고 다양한 변환을 시각화', ready: true, colorClass: 'card-exp', init: () => window.initGraph() },
        { id: 'factor', icon: '✖️', title: '인수분해', subtitle: 'X자 크로스 훈련장과 스피드 퀴즈', ready: true, colorClass: 'card-factor', init: () => window.initFactor() },
        { id: 'quad', icon: '〰️', title: '이차함수', subtitle: '평행이동과 제한된 구간의 최대/최소', ready: true, colorClass: 'card-quad', init: () => window.initQuad() },
        { id: 'matrix', icon: '🔲', title: '행렬과 변환', subtitle: '선형 변환을 이미지로 직관적으로 확인', ready: true, colorClass: 'card-matrix', init: () => window.initMatrix() },
        { id: 'trig', icon: '〽️', title: '삼각함수', subtitle: '단위원과 그래프로 sin·cos·tan 이해', ready: true, colorClass: 'card-trig', init: () => window.initTrig() },
        { id: 'seq', icon: '🔢', title: '수열', subtitle: '시그마(Σ) 거듭제곱의 합 테트리스 퍼즐', ready: true, colorClass: 'card-seq', init: () => window.initSeq() },
        { id: 'limit', icon: '→', title: '극한과 연속', subtitle: '함수의 극한과 연속', ready: false, colorClass: 'card-limit', init: null },
        { id: 'deriv', icon: '📐', title: '미분', subtitle: '할선→접선 수렴 + 도함수 실시간 그래프', ready: true, colorClass: 'card-deriv', init: () => window.initDeriv() },
        { id: 'integ', icon: '∫', title: '적분', subtitle: '상합·하합으로 구분구적법 시각화', ready: true, colorClass: 'card-integ', init: () => window.initInteg() },
        { id: 'prob', icon: '🎲', title: '확률과 통계', subtitle: '직관을 깨는 몬티홀 딜레마 시뮬레이션', ready: true, colorClass: 'card-limit', init: () => window.probShowTab ? window.probShowTab('pascal') : null },
        { id: 'geom', icon: '🌀', title: '기하', subtitle: '이차곡선 · 벡터 · 공간도형', ready: true, colorClass: 'card-trig', init: () => window.initGeom && window.initGeom() },
    ];


    // 단원별 인덱스 패널 ID (없는 단원은 항목 없음 → 인덱스 전부 숨김)
    const UNIT_INDEX_MAP = {
        poly: 'idx-poly',
        factor: 'idx-factor',
        trig: 'idx-trig',
        integ: 'idx-integ',
        seq: 'idx-seq',
        quad: 'idx-quad',
        deriv: 'idx-deriv',
        prob: 'idx-prob',
        geom: 'idx-geom',
    };

    const initialized = new Set();

    const homeScreen = document.getElementById('home-screen');
    const unitTopbar = document.getElementById('unit-topbar');
    const appContainer = document.querySelector('.app-container');
    const cardGrid = document.getElementById('card-grid');
    const backBtn = document.getElementById('back-btn');
    const breadcrumb = document.getElementById('breadcrumb-title');
    const unitContents = document.querySelectorAll('.unit-content');
    const unitFooter = document.getElementById('unit-footer');
    const allIndexPanels = document.querySelectorAll('.side-index-wrapper[id^="idx-"]');

    unitTopbar.style.display = 'none';
    appContainer.style.display = 'none';
    if (unitFooter) unitFooter.style.display = 'none';

    /* 카드 렌더링 */
    function renderCards() {
        UNITS.forEach((unit, i) => {
            const card = document.createElement('div');
            card.className = `unit-card ${unit.colorClass}${unit.ready ? '' : ' coming-soon'}`;
            card.style.animationDelay = `${i * 55}ms`;
            card.innerHTML = `
                <div class="card-badge ${unit.ready ? 'badge-ready' : 'badge-soon'}">
                    ${unit.ready ? '✓ 사용 가능' : '준비 중'}
                </div>
                <div class="card-icon">${unit.icon}</div>
                <div class="card-body">
                    <div class="card-title">${unit.title}</div>
                    <div class="card-subtitle">${unit.subtitle}</div>
                </div>
                ${unit.ready ? '<div class="card-arrow">→</div>' : ''}
            `;
            if (unit.ready) card.addEventListener('click', () => navigateTo(unit));
            cardGrid.appendChild(card);
        });
    }

    /* 인덱스 패널 전환 */
    function switchIndexPanel(unitId) {
        allIndexPanels.forEach(p => p.style.display = 'none');
        const targetId = UNIT_INDEX_MAP[unitId];
        if (targetId) {
            const panel = document.getElementById(targetId);
            if (panel) panel.style.display = 'flex';
        }
    }

    /* 단원으로 이동 */
    function navigateTo(unit) {
        homeScreen.style.display = 'none';
        unitTopbar.style.display = 'flex';
        unitTopbar.style.marginBottom = '16px';
        appContainer.style.display = 'block';
        appContainer.style.marginTop = '0';
        if (unitFooter) unitFooter.style.display = 'block';

        if (breadcrumb) breadcrumb.textContent = unit.title;

        unitContents.forEach(el => {
            el.classList.toggle('active', el.id === 'unit-' + unit.id);
        });

        switchIndexPanel(unit.id);

        /* 확률과 통계 / 기하 드롭다운 네비 표시/숨김 */
        const probNav = document.getElementById('prob-nav');
        if (probNav) probNav.style.display = unit.id === 'prob' ? 'flex' : 'none';
        const geomNav = document.getElementById('geom-nav');
        if (geomNav) geomNav.style.display = unit.id === 'geom' ? 'flex' : 'none';
        const trigNav = document.getElementById('trig-nav');
        if (trigNav) trigNav.style.display = unit.id === 'trig' ? 'flex' : 'none';
        if (unit.init && !initialized.has(unit.id)) {
            initialized.add(unit.id);
            setTimeout(unit.init, 300);
        } else {
            if (unit.id === 'poly') setTimeout(() => window.initPoly(), 50);
            if (unit.id === 'exp') setTimeout(() => window.renderAllExpGraphs(), 50);
            if (unit.id === 'integ') setTimeout(() => window.drawInteg(), 50);
            if (unit.id === 'matrix') setTimeout(() => { window.drawOriginal(); window.applyMatrixTransform(); }, 50);
            if (unit.id === 'trig') setTimeout(() => window.drawTrig(), 50);
            if (unit.id === 'deriv') setTimeout(() => window.initDeriv && window.initDeriv(), 50);
            if (unit.id === 'seq') setTimeout(() => window.seqRedraw && window.seqRedraw(), 50);
            if (unit.id === 'quad') setTimeout(() => window.initQuad(), 50);
            if (unit.id === 'prob') setTimeout(() => {
                if (window.probShowTab) window.probShowTab(window.probCurrentTab || 'pascal');
            }, 300);
        }
        showTutorial(unit.id);
    }

    /* 홈으로 */
    function navigateHome() {
        appContainer.style.display = 'none';
        unitTopbar.style.display = 'none';
        if (unitFooter) unitFooter.style.display = 'none';
        homeScreen.style.display = 'flex';
        homeScreen.style.flexDirection = 'column';
        homeScreen.style.alignItems = 'center';
        unitContents.forEach(el => el.classList.remove('active'));
        allIndexPanels.forEach(p => p.style.display = 'none');

        /* prob-nav / geom-nav 숨기기 */
        const probNav = document.getElementById('prob-nav');
        if (probNav) probNav.style.display = 'none';
        const geomNav = document.getElementById('geom-nav');
        if (geomNav) geomNav.style.display = 'none';
        const trigNav = document.getElementById('trig-nav');
        if (trigNav) trigNav.style.display = 'none';
    }

    if (backBtn) backBtn.addEventListener('click', navigateHome);

    /* 삼각함수 드롭다운 네비 */
    document.querySelectorAll('#trig-nav [data-trigfunc]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#trig-nav [data-trigfunc]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const trigTabBtn = document.querySelector(`.tab-btn[data-func="${btn.dataset.trigfunc}"]`);
            if (trigTabBtn) trigTabBtn.click();
        });
    });

    /* 수열 인덱스 탭 → seq.js 탭 연동 */
    document.querySelectorAll('#idx-seq .index-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#idx-seq .index-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // seq.js를 통해 패널 전환 (이미 로딩된 경우만)
            if (window.seqSwitchPanel) window.seqSwitchPanel(tab.dataset.seqtab);
        });
    });

    /* 이차함수 인덱스 탭 → quad.js 탭 연동 */
    document.querySelectorAll('#idx-quad .index-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#idx-quad .index-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (window.quadSwitchPanel) window.quadSwitchPanel(tab.dataset.quadtab);
        });
    });

    /* 미분 인덱스 탭 → deriv.js 탭 연 연동 */
    document.querySelectorAll('#idx-deriv .index-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#idx-deriv .index-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (window.derivSwitchPanel) window.derivSwitchPanel(tab.dataset.derivtab);
        });
    });

    /* 기하 드롭다운 네비 — 그룹 버튼 클릭 시 바로 패널 전환 */
    document.querySelectorAll('#geom-nav .prob-nav-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tab = btn.dataset.navgroup;

            /* active 상태 동기화 */
            document.querySelectorAll('#geom-nav .prob-nav-group-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('#geom-nav .prob-nav-item').forEach(i => {
                i.classList.toggle('active', i.dataset.geomtab === tab);
            });

            /* 드롭다운은 hover로만 — 클릭 시 바로 닫기 */
            document.querySelectorAll('#geom-nav .prob-nav-group').forEach(g => g.classList.remove('open'));

            if (window.geomSwitchPanel) window.geomSwitchPanel(tab);
        });
    });

    /* 기하 드롭다운 아이템 클릭 (하위 탭이 여러 개일 때 대비) */
    document.querySelectorAll('#geom-nav .prob-nav-item[data-geomtab]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const tab = item.dataset.geomtab;
            document.querySelectorAll('#geom-nav .prob-nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('#geom-nav .prob-nav-group-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.navgroup === tab);
            });
            document.querySelectorAll('#geom-nav .prob-nav-group').forEach(g => g.classList.remove('open'));
            if (window.geomSwitchPanel) window.geomSwitchPanel(tab);
        });
    });

    /* 외부 클릭 시 기하 드롭다운 닫기 */
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('#geom-nav')) {
            document.querySelectorAll('#geom-nav .prob-nav-group').forEach(g => g.classList.remove('open'));
        }
    });
    renderCards();
});