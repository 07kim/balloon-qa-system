/**
 * 参加者画面 (index.html) メインアプリケーションロジック
 * 中央キャラクター ＆ 放射状浮遊風船UI
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM参照
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // タブ1
  const charGrid = document.getElementById('character-grid');
  const questionInput = document.getElementById('question-input');
  const submitBtn = document.getElementById('submit-btn');
  const formAlert = document.getElementById('form-alert');
  
  // タブ2: 放射状バルーンステージ
  const balloonStage = document.getElementById('balloon-stage');
  const radialIcon = document.getElementById('radial-char-icon');
  const radialName = document.getElementById('radial-char-name');
  const btnPrevChar = document.getElementById('btn-user-char-prev');
  const btnNextChar = document.getElementById('btn-user-char-next');
  const emptyStageMsg = document.getElementById('empty-stage-msg');
  const emptyStageText = document.getElementById('empty-stage-text');
  const syncTimeSpan = document.getElementById('last-sync-time');
  const balloonFilterBtns = document.querySelectorAll('[data-balloon-filter]');

  // 内部状態
  let selectedSubmitCharId = 1;
  let activeDisplayCharId = 1; // 1〜10 (バルーン表示タブで中央に表示するキャラ)
  let rawQuestions = [];
  let pollTimer = null;
  let balloonSubFilter = 'all'; // 'all', 'pending', 'answered'

  // 1. 初期化
  renderCharacterSelection();
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

  // 3. サブフィルター切替
  balloonFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      balloonFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      balloonSubFilter = btn.getAttribute('data-balloon-filter');
      applyFilterAndRender();
    });
  });

  // 4. キャラクター左右切替ボタン (◀ ▶)
  btnPrevChar.addEventListener('click', () => {
    activeDisplayCharId = activeDisplayCharId > 1 ? activeDisplayCharId - 1 : CHARACTERS.length;
    updateRadialCenterChar();
    applyFilterAndRender();
  });

  btnNextChar.addEventListener('click', () => {
    activeDisplayCharId = activeDisplayCharId < CHARACTERS.length ? activeDisplayCharId + 1 : 1;
    updateRadialCenterChar();
    applyFilterAndRender();
  });

  function updateRadialCenterChar() {
    const char = getCharacterById(activeDisplayCharId);
    if (radialIcon && radialName) {
      radialIcon.innerHTML = char.icon;
      radialName.textContent = char.name;
    }
  }

  // 5. 質問送信フォーム キャラクター選択
  function renderCharacterSelection() {
    charGrid.innerHTML = '';
    CHARACTERS.forEach(char => {
      const card = document.createElement('div');
      card.className = `character-card ${char.id === selectedSubmitCharId ? 'selected' : ''}`;
      card.setAttribute('data-id', char.id);
      card.innerHTML = `
        <div class="character-avatar">${char.icon}</div>
        <span class="character-name">${char.name}</span>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedSubmitCharId = char.id;
        hideAlert();
      });

      charGrid.appendChild(card);
    });
  }

  // 6. 質問送信
  submitBtn.addEventListener('click', async () => {
    const questionText = questionInput.value.trim();

    if (!selectedSubmitCharId) {
      showAlert('キャラクターを1つ選択してください！', 'error');
      return;
    }
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

  function hideAlert() {
    formAlert.className = 'alert-message';
    formAlert.textContent = '';
  }

  // 7. データ同期
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

  // 8. 放射状風船のフィルタリングと描画
  function applyFilterAndRender() {
    // 選択中のキャラクター宛て かつ 消滅していない質問
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

    // 既存の風船DOMをクリア
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
    
    // 中央座標
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2;

    // 半径（画面サイズに合わせて調整）
    const radiusX = Math.min(centerX - 90, 260);
    const radiusY = Math.min(centerY - 80, 190);

    questions.forEach((q, i) => {
      const qId = String(q.id);
      const tapCount = Number(q.tapCount || 0);
      const sizeLevel = Math.min(5, Math.floor(tapCount / 4) + 1);
      const sizeClass = `balloon-size-${sizeLevel}`;

      // 円周上の角度
      const angle = (2 * Math.PI / count) * i - Math.PI / 2;
      const posX = centerX + radiusX * Math.cos(angle);
      const posY = centerY + radiusY * Math.sin(angle);

      const wrapper = document.createElement('div');
      wrapper.className = `balloon-wrapper ${sizeClass} float-${(i % 3) + 1}`;
      wrapper.setAttribute('data-id', qId);

      // 初期位置設定 (中央基準でpx配置)
      wrapper.style.left = `${posX}px`;
      wrapper.style.top = `${posY}px`;
      wrapper.style.transform = 'translate(-50%, -50%)';

      if (balloonSubFilter === 'answered' && q.answer) {
        wrapper.classList.add('flipped');
      }

      wrapper.innerHTML = createBalloonContentHTML(q, tapCount);

      // タップイベント
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
