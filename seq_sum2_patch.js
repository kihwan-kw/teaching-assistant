/* ========================================================= */
/* --- seq_sum2_patch.js : seq.js 초기화 후 3D 모듈 연결  --- */
/* seq.js의 drawSum2를 3D 버전으로 교체                    --- */
/* index.html에서 seq.js 다음에 이 파일을 로드하세요       --- */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    /* seq.js initSeq 가 호출된 뒤 3D 모듈을 덮어씌움 */
    const canvas2 = document.getElementById('seq-canvas-sum2');
    const slider2 = document.getElementById('seq-slider-sum2');
    const nVal2 = document.getElementById('seq-n-val-sum2');
    const fb2 = document.getElementById('seq-feedback-sum2');

    if (canvas2 && window.initSum2_3D) {
        window.initSum2_3D(canvas2, slider2, nVal2, fb2);
    }
});

/* main.js의 navigateTo에서 'seq' 단원으로 이동할 때 리드로우 */
const _origSeqRedraw = window.seqRedraw;
window.seqRedraw = function () {
    if (_origSeqRedraw) _origSeqRedraw();

    /* seq-panel-sum2가 active 상태일 때만 3D 재렌더 */
    const panel = document.getElementById('seq-panel-sum2');
    if (panel && panel.classList.contains('active')) {
        const canvas2 = document.getElementById('seq-canvas-sum2');
        if (canvas2 && window.initSum2_3D) {
            /* 이미 초기화됐으므로 크기만 맞추고 render 트리거 */
            const unitSeq = document.getElementById('unit-seq');
            const availW = Math.max(300, (unitSeq ? unitSeq.clientWidth : 900) - 40);
            canvas2.width = availW;
            canvas2.height = Math.round(availW * 0.58);
            /* render는 seq_sum2_3d.js 내부 클로저가 가지고 있으므로
               슬라이더 input 이벤트를 트리거해 재렌더  */
            const slider2 = document.getElementById('seq-slider-sum2');
            if (slider2) slider2.dispatchEvent(new Event('input'));
        }
    }
};