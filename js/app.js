/**
 * 参加者画面 (index.html) メインアプリケーションロジック
 * iPad最適化: 中央1体カルーセル ＆ 吹き出し型質問入力 ＆ 放射状浮遊風船
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM参照 ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // タブ1: 質問送信 カルーセル
  const btnSubmitPrev = document.getElementById('btn-submit-char-prev');
  const btnSubmitNext = document.getElementById('btn-submit-char-next');
  const submitSlotLeft = document.getElementById('submit-slot-left');
  const submitSlotLeftIcon = document.getElementById('submit-slot-left-icon');
  const submitSlotLeftName = document.getElementById('submit-slot-left-name');
  const submitSlotCenter = document.getElementById('submit-slot-center');
  const submitSlotCenterIcon = document.getElementById('submit-slot-center-icon');
  const submitSlotCenterName = document.getElementById('submit-slot-center-name');
  const submitSlotRight = document.getElementById('submit-slot-right');
  const submitSlotRightIcon = document.getElementById('submit-slot-right-icon');
  const submitSlotRightName = document.getElementById('submit-slot-right-name');
  const questionInput = document.getElementById('question-input');
  const submitBtn = document.getElementById('submit-btn');
  const formAlert = document.getElementById('form-alert');
  const submitCarouselStage = document.getElementById('submit-carousel-stage');
  
  // タブ2: 放射状バルーンステージ
  const balloonStage = document.getElementById('balloon-stage');
  const radialIcon = document.getElementById('radial-char-icon');
  const radialName = document.getElementById('radial-char-name');
  const btnUserCharPrev = document.getElementById('btn-user-char-prev');
  const btnUserCharNext = document.getElementById('btn-user-char-next');
  const emptyStageMsg = document.getElementById('empty-stage-msg');
  const emptyStageText = document.getElementById('empty-stage-text');
  const syncTimeSpan = document.getElementById('last-sync-time');
  const balloonFilterBtns = document.querySelectorAll('[data-balloon-filter]');

  // --- 内部状態 ---
  let selectedSubmitCharId = 1; // 1〜10 (送信画面で選ばれているキャラ)
  let activeDisplayCharId = 1;  // 1〜10 (風船画面で表示中のキャラ)
  let rawQuestions = [];
  let pollTimer = null;
  let balloonSubFilter = 'all'; // 'all', 'pending', 'answered'

  // 1. 初期化
  updateSubmitCarouselSlots();
  updateRadialCenterChar();

  // 2. メインタブ切替
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');

      if (targetTab === 'balloons') {
        syncBalloons();
        startPolling();
      } else {
        stopPolling();
      }
    });
  });

  // ==========================================================================
  // タブ1: 質問送信画面 カルーセル切替
  // ==========================================================================
  btnSubmitPrev.addEventListener('click', () => navigateSubmitChar(-1));
  btnSubmitNext.addEventListener('click', () => navigateSubmitChar(1));
  submitSlotLeft.addEventListener('click', () => navigateSubmitChar(-1));
  submitSlotRight.addEventListener('click', () => navigateSubmitChar(1));

  function navigateSubmitChar(dir) {
    if (dir === -1) {
      selectedSubmitCharId = selectedSubmitCharId > 1 ? selectedSubmitCharId - 1 : CHARACTERS.length;
    } else {
      selectedSubmitCharId = selectedSubmitCharId < CHARACTERS.length ? selectedSubmitCharId + 1 : 1;
    }
    updateSubmitCarouselSlots();
  }

  function updateSubmitCarouselSlots() {
    const total = CHARACTERS.length;
    const prevId = selectedSubmitCharId > 1 ? selectedSubmitCharId - 1 : total;
    const nextId = selectedSubmitCharId < total ? selectedSubmitCharId + 1 : 1;

    const prevChar = getCharacterById(prevId);
    const centerChar = getCharacterById(selectedSubmitCharId);
    const nextChar = getCharacterById(nextId);

    submitSlotLeftIcon.innerHTML = prevChar.icon;
    submitSlotLeftName.textContent = prevChar.name;

    submitSlotCenterIcon.innerHTML = centerChar.icon;
    submitSlotCenterName.textContent = centerChar.name;

    submitSlotRightIcon.innerHTML = nextChar.icon;
    submitSlotRightName.textContent = nextChar.name;
  }

  // スワイプ操作 (送信画面)
  setupSwipe(submitCarouselStage, (dir) => navigateSubmitChar(dir));

  // 質問送信処理
  submitBtn.addEventListener('click', async () => {
    const questionText = questionInput.value.trim();

    if (!questionText) {
      showAlert('質問内容を入力してください！', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>送信中...</span>';

    try {
      const res = await balloonApi.createQuestion(selectedSubmitCharId, questionText);
      if (res && res.status === 'success') {
        showAlert('質問を風船として飛ばしました！🎈', 'success');
        questionInput.value = '';
        activeDisplayCharId = selectedSubmitCharId;
        updateRadialCenterChar();
        
        setTimeout(() => {
          document.querySelector('.tab-btn[data-tab="balloons"]').click();
        }, 1000);
      } else {
        showAlert('送信に失敗しました。再試行してください。', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('エラーが発生しました。', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>風船を飛ばす 🎈</span>';
    }
  });

  function showAlert(msg, type) {
    formAlert.textContent = msg;
    formAlert.className = `alert-message ${type}`;
  }

  // ==========================================================================
  // タブ2: 放射状バルーンステージ
  // ==========================================================================
  btnUserCharPrev.addEventListener('click', () => navigateDisplayChar(-1));
  btnUserCharNext.addEventListener('click', () => navigateDisplayChar(1));

  function navigateDisplayChar(dir) {
    if (dir === -1) {
      activeDisplayCharId = activeDisplayCharId > 1 ? activeDisplayCharId - 1 : CHARACTERS.length;
    } else {
      activeDisplayCharId = activeDisplayCharId < CHARACTERS.length ? activeDisplayCharId + 1 : 1;
    }
    updateRadialCenterChar();
    applyFilterAndRender();
  }

  function updateRadialCenterChar() {
    const char = getCharacterById(activeDisplayCharId);
    if (radialIcon && radialName) {
      radialIcon.innerHTML = char.icon;
      radialName.textContent = char.name;
    }
  }

  setupSwipe(balloonStage, (dir) => navigateDisplayChar(dir));

  // サブフィルター切替 (すべて / 質問 / 回答を見る)
  balloonFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      balloonFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      balloonSubFilter = btn.getAttribute('data-balloon-filter');
      applyFilterAndRender();
    });
  });

  // データ同期
  async function syncBalloons() {
    try {
      rawQuestions = await balloonApi.fetchQuestions();
      applyFilterAndRender();
      
      const now = new Date();
      if (syncTimeSpan) {
        syncTimeSpan.textContent = now.toLocaleTimeString();
      }
    } catch (err) {
      console.error('Balloon sync error:', err);
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(syncBalloons, 4000);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function applyFilterAndRender() {
    let valid = rawQuestions.filter(q => Number(q.character) === Number(activeDisplayCharId) && !q.isPopped && Number(q.tapCount || 0) < 20);

    if (balloonSubFilter === 'pending') {
      valid = valid.filter(q => !q.answer);
    } else if (balloonSubFilter === 'answered') {
      valid = valid.filter(q => !!q.answer);
    }

    renderRadialBalloons(valid);
  }

  function renderRadialBalloons(questions) {
    if (!balloonStage) return;

    const oldBalloons = balloonStage.querySelectorAll('.balloon-wrapper');
    oldBalloons.forEach(b => b.remove());

    if (questions.length === 0) {
      emptyStageMsg.style.display = 'block';
      const char = getCharacterById(activeDisplayCharId);
      if (balloonSubFilter === 'pending') {
        emptyStageText.innerHTML = `${char.name} 宛ての未回答質問はありません。`;
      } else if (balloonSubFilter === 'answered') {
        emptyStageText.innerHTML = `${char.name} 宛ての回答済み風船はまだありません。`;
      } else {
        emptyStageText.innerHTML = `${char.name} 宛ての風船はまだ届いていません。<br>「質問を送る」から飛ばしてみましょう！`;
      }
      return;
    } else {
      emptyStageMsg.style.display = 'none';
    }

    const count = questions.length;
    const stageWidth = balloonStage.clientWidth || 800;
    const stageHeight = balloonStage.clientHeight || 560;
    
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2;

    const radiusX = Math.min(centerX - 90, 260);
    const radiusY = Math.min(centerY - 80, 190);

    questions.forEach((q, i) => {
      const qId = String(q.id);
      const tapCount = Number(q.tapCount || 0);
      const sizeLevel = Math.min(5, Math.floor(tapCount / 4) + 1);
      const sizeClass = `balloon-size-${sizeLevel}`;

      const angle = (2 * Math.PI / count) * i - Math.PI / 2;
      const posX = centerX + radiusX * Math.cos(angle);
      const posY = centerY + radiusY * Math.sin(angle);

      const wrapper = document.createElement('div');
      wrapper.className = `balloon-wrapper ${sizeClass} float-${(i % 3) + 1}`;
      wrapper.setAttribute('data-id', qId);

      wrapper.style.left = `${posX}px`;
      wrapper.style.top = `${posY}px`;
      wrapper.style.transform = 'translate(-50%, -50%)';

      if (balloonSubFilter === 'answered' && q.answer) {
        wrapper.classList.add('flipped');
      }

      wrapper.innerHTML = createBalloonContentHTML(q, tapCount);
      wrapper.addEventListener('click', (e) => handleBalloonClick(e, wrapper, q));

      balloonStage.appendChild(wrapper);
    });
  }

  function createBalloonContentHTML(q, tapCount) {
    return `
      <div class="balloon-card">
        <!-- 表面 (質問) -->
        <div class="balloon-face balloon-front">
          <div class="balloon-tap-badge">${tapCount}/20</div>
          <div class="balloon-question-text">${escapeHTML(q.question)}</div>
          <div class="balloon-knot"></div>
        </div>
        <!-- 裏面 (回答) -->
        <div class="balloon-face balloon-back">
          <div class="balloon-answer-title">運営からの回答</div>
          <div class="balloon-answer-text ${!q.answer ? 'waiting' : ''}">${q.answer ? escapeHTML(q.answer) : '回答待ち...'}</div>
          <div class="balloon-knot" style="border-bottom-color: var(--primary-color)"></div>
        </div>
      </div>
    `;
  }

  async function handleBalloonClick(e, wrapper, q) {
    const qId = String(q.id);
    wrapper.classList.toggle('flipped');
    wrapper.classList.add('balloon-tap-effect');
    setTimeout(() => wrapper.classList.remove('balloon-tap-effect'), 300);

    try {
      const result = await balloonApi.recordTap(qId);
      if (result && result.status === 'success' && result.data) {
        const updatedCount = Number(result.data.tapCount);
        q.tapCount = updatedCount;

        const badge = wrapper.querySelector('.balloon-tap-badge');
        if (badge) badge.textContent = `${updatedCount}/20`;

        const sizeLevel = Math.min(5, Math.floor(updatedCount / 4) + 1);
        for (let i = 1; i <= 5; i++) {
          wrapper.classList.remove(`balloon-size-${i}`);
        }
        wrapper.classList.add(`balloon-size-${sizeLevel}`);

        if (updatedCount >= 20 || result.data.isPopped) {
          wrapper.classList.add('balloon-popping');
          setTimeout(() => {
            wrapper.remove();
          }, 600);
        }
      }
    } catch (err) {
      console.error('Tap recording failed:', err);
    }
  }

  // タッチスワイプ検知ユーティリティ
  function setupSwipe(element, callback) {
    if (!element) return;
    let startX = 0;
    let startY = 0;

    element.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].screenX;
      const endY = e.changedTouches[0].screenY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // 横スワイプ判定 (50px以上)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          callback(-1); // 右スワイプ -> 前のキャラ
        } else {
          callback(1);  // 左スワイプ -> 次のキャラ
        }
      }
    }, { passive: true });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
