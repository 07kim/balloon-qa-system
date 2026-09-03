/**
 * 参加者画面 (index.html) メインアプリケーションロジック
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 要素参照 ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // タブ1: 質問送信
  const charGrid = document.getElementById('character-grid');
  const questionInput = document.getElementById('question-input');
  const submitBtn = document.getElementById('submit-btn');
  const formAlert = document.getElementById('form-alert');
  
  // タブ2: バルーン浮遊表示
  const balloonStage = document.getElementById('balloon-stage');
  const emptyStageMsg = document.getElementById('empty-stage-msg');
  const emptyStageText = document.getElementById('empty-stage-text');
  const stageCharsContainer = document.getElementById('stage-characters');
  const syncTimeSpan = document.getElementById('last-sync-time');
  const balloonFilterBtns = document.querySelectorAll('[data-balloon-filter]');
  
  // --- 内部状態 ---
  let selectedCharId = null;
  let rawQuestions = [];
  let currentQuestions = [];
  let pollTimer = null;
  let balloonSubFilter = 'all'; // 'all', 'pending', 'answered'
  const positionsMap = new Map(); // questionId -> { top, left, floatClass }

  // 1. 初期化: キャラクターグリッドの描画
  renderCharacterSelection();
  renderStageCharacters();

  // 2. メインタブ切替イベントの登録 (質問を送る / 風船を見る)
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

  // 3. バルーン表示タブ内のサブタブ切替 (すべて / 質問を見る / 回答を見る)
  balloonFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      balloonFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      balloonSubFilter = btn.getAttribute('data-balloon-filter');
      applyFilterAndRender();
    });
  });

  // 4. キャラクター選択UI構築
  function renderCharacterSelection() {
    charGrid.innerHTML = '';
    CHARACTERS.forEach(char => {
      const card = document.createElement('div');
      card.className = 'character-card';
      card.setAttribute('data-id', char.id);
      card.innerHTML = `
        <div class="character-avatar">${char.icon}</div>
        <span class="character-name">${char.name}</span>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedCharId = char.id;
        hideAlert();
      });

      charGrid.appendChild(card);
    });
  }

  // 5. ステージ下部のキャラクターイラスト配置
  function renderStageCharacters() {
    if (!stageCharsContainer) return;
    stageCharsContainer.innerHTML = '';
    CHARACTERS.forEach(char => {
      const item = document.createElement('div');
      item.className = 'stage-char-item';
      item.innerHTML = `
        <div class="stage-char-avatar">${char.icon}</div>
        <span class="stage-char-name">${char.name}</span>
      `;
      stageCharsContainer.appendChild(item);
    });
  }

  // 6. 質問送信処理
  submitBtn.addEventListener('click', async () => {
    const questionText = questionInput.value.trim();

    // 未入力ブロック処理
    if (!selectedCharId) {
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
      const res = await balloonApi.createQuestion(selectedCharId, questionText);
      if (res && res.status === 'success') {
        showAlert('質問を風船として飛ばしました！🎈', 'success');
        questionInput.value = '';
        
        setTimeout(() => {
          document.querySelector('.tab-btn[data-tab="balloons"]').click();
        }, 1200);
      } else {
        showAlert('送信に失敗しました。時間をおいて再試行してください。', 'error');
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

  // 7. バルーンデータ取得・リアルタイム同期
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

  function applyFilterAndRender() {
    // 消滅(20タップ)していない風船が対象
    let validQuestions = rawQuestions.filter(q => !q.isPopped && Number(q.tapCount || 0) < 20);

    if (balloonSubFilter === 'pending') {
      // 質問を見る (未回答のみ)
      validQuestions = validQuestions.filter(q => !q.answer);
    } else if (balloonSubFilter === 'answered') {
      // 回答を見る (回答済みのみ)
      validQuestions = validQuestions.filter(q => !!q.answer);
    }

    currentQuestions = validQuestions;
    renderBalloons(currentQuestions);
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

  // 8. バルーンの描画＆位置・アニメーション制御
  function renderBalloons(questions) {
    if (!balloonStage) return;

    if (questions.length === 0) {
      emptyStageMsg.style.display = 'block';
      if (balloonSubFilter === 'pending') {
        emptyStageText.innerHTML = '現在、未回答の質問風船はありません。<br>新しく質問を送信してみましょう！';
      } else if (balloonSubFilter === 'answered') {
        emptyStageText.innerHTML = 'まだ運営からの回答がある風船はありません。<br>回答が入力されるとここに表示されます！';
      } else {
        emptyStageText.innerHTML = 'まだ風船が届いていません。<br>「質問を送る」タブから一番乗りの質問を飛ばしてみましょう！';
      }
    } else {
      emptyStageMsg.style.display = 'none';
    }

    // 画面外に消えた風船DOMを削除
    const existingElements = Array.from(balloonStage.querySelectorAll('.balloon-wrapper'));
    const currentIds = new Set(questions.map(q => String(q.id)));

    existingElements.forEach(el => {
      const qId = el.getAttribute('data-id');
      if (!currentIds.has(qId)) {
        el.classList.add('balloon-popping');
        setTimeout(() => el.remove(), 600);
      }
    });

    // 各質問の風船を作成・更新
    questions.forEach((q, index) => {
      const qId = String(q.id);
      let wrapper = balloonStage.querySelector(`.balloon-wrapper[data-id="${qId}"]`);
      const char = getCharacterById(q.character);
      const tapCount = Number(q.tapCount || 0);

      // サイズ計算: 20回を5段階に分ける（約4回ごとに1段階UP）
      const sizeLevel = Math.min(5, Math.floor(tapCount / 4) + 1);
      const sizeClass = `balloon-size-${sizeLevel}`;

      if (!wrapper) {
        // 新規作成
        wrapper = document.createElement('div');
        wrapper.className = `balloon-wrapper ${sizeClass}`;
        wrapper.setAttribute('data-id', qId);

        // 「回答を見る」タブ選択時は最初から裏返して回答を見せる
        if (balloonSubFilter === 'answered' && q.answer) {
          wrapper.classList.add('flipped');
        }

        // ランダム浮遊位置設定
        let pos = positionsMap.get(qId);
        if (!pos) {
          const topPct = 12 + Math.floor(Math.random() * 55);
          const leftPct = 8 + Math.floor(Math.random() * 74);
          const floatAnimClass = `float-${(index % 3) + 1}`;
          pos = { top: topPct, left: leftPct, floatClass: floatAnimClass };
          positionsMap.set(qId, pos);
        }

        wrapper.style.top = `${pos.top}%`;
        wrapper.style.left = `${pos.left}%`;
        wrapper.classList.add(pos.floatClass);

        wrapper.innerHTML = createBalloonContentHTML(q, char, tapCount);

        // タップハンドラ
        wrapper.addEventListener('click', (e) => handleBalloonClick(e, wrapper, q));

        balloonStage.appendChild(wrapper);
      } else {
        // 既存風船の更新
        for (let i = 1; i <= 5; i++) {
          wrapper.classList.remove(`balloon-size-${i}`);
        }
        wrapper.classList.add(sizeClass);
        updateBalloonInnerHTML(wrapper, q, char, tapCount);
      }
    });
  }

  function createBalloonContentHTML(q, char, tapCount) {
    return `
      <div class="balloon-card">
        <!-- 表面 (質問) -->
        <div class="balloon-face balloon-front" style="background-color: ${char.balloonColor}; border-color: ${char.color};">
          <div class="balloon-tap-badge">タップ: ${tapCount}/20</div>
          <div class="balloon-char-icon">${char.icon}</div>
          <div class="balloon-question-text">${escapeHTML(q.question)}</div>
          <div class="balloon-knot" style="color: ${char.color}"></div>
          <div class="balloon-string"></div>
        </div>
        <!-- 裏面 (回答) -->
        <div class="balloon-face balloon-back">
          <div class="balloon-answer-title">運営からの回答</div>
          <div class="balloon-answer-text ${!q.answer ? 'waiting' : ''}">${q.answer ? escapeHTML(q.answer) : '回答待ち...'}</div>
          <div class="balloon-knot" style="color: var(--primary-color)"></div>
          <div class="balloon-string"></div>
        </div>
      </div>
    `;
  }

  function updateBalloonInnerHTML(wrapper, q, char, tapCount) {
    const badge = wrapper.querySelector('.balloon-tap-badge');
    if (badge) badge.textContent = `タップ: ${tapCount}/20`;

    const answerElem = wrapper.querySelector('.balloon-answer-text');
    if (answerElem) {
      if (q.answer) {
        answerElem.textContent = q.answer;
        answerElem.classList.remove('waiting');
      } else {
        answerElem.textContent = '回答待ち...';
        answerElem.classList.add('waiting');
      }
    }
  }

  // タップ処理
  async function handleBalloonClick(e, wrapper, q) {
    const qId = String(q.id);

    // フリップ切り替え
    wrapper.classList.toggle('flipped');

    // タップ時バウンス
    wrapper.classList.add('balloon-tap-effect');
    setTimeout(() => wrapper.classList.remove('balloon-tap-effect'), 300);

    // カウントアップ通信
    try {
      const result = await balloonApi.recordTap(qId);
      if (result && result.status === 'success' && result.data) {
        const updatedCount = Number(result.data.tapCount);
        q.tapCount = updatedCount;

        const badge = wrapper.querySelector('.balloon-tap-badge');
        if (badge) badge.textContent = `タップ: ${updatedCount}/20`;

        const sizeLevel = Math.min(5, Math.floor(updatedCount / 4) + 1);
        for (let i = 1; i <= 5; i++) {
          wrapper.classList.remove(`balloon-size-${i}`);
        }
        wrapper.classList.add(`balloon-size-${sizeLevel}`);

        if (updatedCount >= 20 || result.data.isPopped) {
          wrapper.classList.add('balloon-popping');
          setTimeout(() => {
            wrapper.remove();
            positionsMap.delete(qId);
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

  if (document.getElementById('tab-balloons').classList.contains('active')) {
    syncBalloons();
    startPolling();
  }
});
