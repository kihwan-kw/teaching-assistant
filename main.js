/* ========================================================= */
/* --- Main (메인 진입점 & 홈 화면 + 탭 네비게이션) --- */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* ---- 단원 메타데이터 ---- */
    const UNITS = [
        {
            id: 'exp',
            icon: '📈',
            title: '그래프 그리기',
            subtitle: '함수를 입력하고 다양한 변환을 시각화',
            ready: true,
            colorClass: 'card-exp',
            init: initGraph,
        },
        {
            id: 'factor',
            icon: '✖️',
            title: '인수분해',
            subtitle: 'X자 크로스 훈련장과 스피드 퀴즈',
            ready: true,
            colorClass: 'card-factor',
            init: initFactor,
        },
        {
            id: 'matrix',
            icon: '🔲',
            title: '행렬과 변환',
            subtitle: '선형 변환을 이미지로 직관적으로 확인',
            ready: true,
            colorClass: 'card-matrix',
            init: initMatrix,
        },
        {
            id: 'trig',
            icon: '〽️',
            title: '삼각함수',
            subtitle: '단위원과 그래프로 sin·cos·tan 이해',
            ready: true,
            colorClass: 'card-trig',
            init: initTrig,
        },
        {
            id: 'integ',
            icon: '∫',
            title: '적분',
            subtitle: '상합·하합으로 구분구적법 시각화',
            ready: true,
            colorClass: 'card-integ',
            init: initInteg,
        },
        {
            id: 'seq',
            icon: '🔢',
            title: '수열',
            subtitle: '등차·등비수열 시각화',
            ready: false,
            colorClass: 'card-seq',
            init: null,
        },
        {
            id: 'limit',
            icon: '→',
            title: '극한과 연속',
            subtitle: '함수의 극한과 연속',
            ready: false,
            colorClass: 'card-limit',
            init: null,
        },
        {
            id: 'deriv',
            icon: '📐',
            title: '미분',
            subtitle: '접선과 도함수 시각화',
            ready: false,
            colorClass: 'card-deriv',
            init: null,
        },
    ];

    /* ---- 초기화 여부 추적 (중복 init 방지) ---- */
    const initialized = new Set();

    /* ---- 요소 참조 ---- */
    const homeScreen = document.getElementById('home-screen');
    const unitScreen = document.getElementById('unit-screen');
    const cardGrid = document.getElementById('card-grid');
    const backBtn = document.getElementById('back-btn');
    const breadcrumb = document.getElementById('breadcrumb-title');
    const unitContents = document.querySelectorAll('.unit-content');

    /* ---- 카드 렌더링 ---- */
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

            if (unit.ready) {
                card.addEventListener('click', () => navigateTo(unit));
            }

            cardGrid.appendChild(card);
        });
    }

    /* ---- 단원으로 이동 ---- */
    function navigateTo(unit) {
        // 홈 숨기기 / 단원 화면 보이기
        homeScreen.classList.remove('active');
        unitScreen.classList.add('active');

        // 브레드크럼 업데이트
        breadcrumb.textContent = unit.title;

        // 해당 unit-content만 표시
        unitContents.forEach(el => {
            el.classList.toggle('active', el.id === 'unit-' + unit.id);
        });

        // 각 모듈 init은 최초 1회만
        if (unit.init && !initialized.has(unit.id)) {
            initialized.add(unit.id);
            // canvas 렌더링 타이밍 보장을 위해 한 프레임 지연
            setTimeout(unit.init, 50);
        } else if (unit.id === 'exp') {
            // 그래프는 전환 시마다 다시 그려야 사이즈가 맞음
            setTimeout(renderAllExpGraphs, 50);
        } else if (unit.id === 'integ') {
            setTimeout(drawInteg, 50);
        } else if (unit.id === 'matrix') {
            setTimeout(() => { drawOriginal(); applyMatrixTransform(); }, 50);
        }
    }

    /* ---- 홈으로 돌아가기 ---- */
    function navigateHome() {
        unitScreen.classList.remove('active');
        homeScreen.classList.add('active');

        // 모든 unit-content 비활성화
        unitContents.forEach(el => el.classList.remove('active'));
    }

    backBtn.addEventListener('click', navigateHome);

    /* ---- 시작 ---- */
    renderCards();

    // 사이드 인덱스 탭도 카드와 동일하게 동작하도록 연결 (하위 호환)
    document.querySelectorAll('.index-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const unitId = tab.dataset.unit;
            const unit = UNITS.find(u => u.id === unitId);
            if (unit && unit.ready) navigateTo(unit);
        });
    });
});