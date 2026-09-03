/**
 * iPad専用 運営管理画面 (admin.html) メインスクリプト
 * 上半分: 中央1体＋左右見切れカルーセル
 * 下半分: 吹き出し型 回答入力エリア
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM参照
  const btnPrev = document.getElementById('btn-admin-prev');
  const btnNext = document.getElementById('btn-admin-next');
  
  const slotLeft = document.getElementById('slot-left');
  const slotLeftIcon = document.getElementById('slot-left-icon');
  const slotLeftName = document.getElementById('slot-left-name');

  const slotCenter = document.getElementById('slot-center');
  const slotCenterIcon = document.getElementById('slot-center-icon');
  const slotCenterName = document.getElementById('slot-center-name');

  const slotRight = document.getElementById('slot-right');
  const slotRightIcon = document.getElementById('slot-right-icon');
  const slotRightName = document.getElementById('slot-right-name');

  const bubbleTitle = document.getElementById('bubble-char-title');
  const questionListContainer = document.getElementById('admin-question-list');
  const filterBtns = document.querySelectorAll('[data-admin-filter]');
  const btnRefresh = document.getElementById('btn-refresh');

  const btnOpenConfig = document.getElementById('btn-open-config');
  const configModal = document.getElementById('config-modal');
  const btnCloseConfig = document.getElementById('btn-close-config');
  const gasUrlInput = document.getElementById('gas-url-input');
  const btnSaveConfig = document.getElementById('btn-save-config');
  const btnResetMock = document.getElementById('btn-reset-mock');

  // 内部状態
  let selectedCharId = 1; // 1〜10
  let questionsData = [];
  let currentFilter = 'all'; // 'all', 'pending', 'answered'

  // 1. 初期ロード
  updateCarouselSlots();
  loadQuestions();

  // 定期自動更新（5秒間隔）
  setInterval(loadQuestions, 5000);

  btnRefresh.addEventListener('click', loadQuestions);

  // 2. 左右矢印ボタンによる切替
  btnPrev.addEventListener('click', () => {
    navigate(-1);
  });

  btnNext.addEventListener('click', () => {
    navigate(1);
  });

  slotLeft.addEventListener('click', () => navigate(-1));
  slotRight.addEventListener('click', () => navigate(1));

  function navigate(dir) {
    if (dir === -1) {
      selectedCharId = selectedCharId > 1 ? selectedCharId - 1 : CHARACTERS.length;
    } else {
      selectedCharId = selectedCharId < CHARACTERS.length ? selectedCharId + 1 : 1;
    }
    updateCarouselSlots();
    renderBubbleQuestions();
  }

  // 3. カルーセルスロットの更新 (左・中央・右)
  function updateCarouselSlots() {
    const total = CHARACTERS.length;
    const prevId = selectedCharId > 1 ? selectedCharId - 1 : total;
    const nextId = selectedCharId < total ? selectedCharId + 1 : 1;

    const prevChar = getCharacterById(prevId);
    const centerChar = getCharacterById(selectedCharId);
    const nextChar = getCharacterById(nextId);

    // 左スロット
    slotLeftIcon.innerHTML = prevChar.icon;
    slotLeftName.textContent = prevChar.name;

    // 中央スロット
    slotCenterIcon.innerHTML = centerChar.icon;
    slotCenterName.textContent = centerChar.name;

    // 右スロット
    slotRightIcon.innerHTML = nextChar.icon;
    slotRightName.textContent = nextChar.name;

    // 吹き出しタイトル
    bubbleTitle.textContent = `${centerChar.name} 宛ての質問一覧`;
  }

  // 4. フィルター切替
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-admin-filter');
      renderBubbleQuestions();
    });
  });

  // 5. 質問データ取得
  async function loadQuestions() {
    try {
      questionsData = await balloonApi.fetchQuestions();
      renderBubbleQuestions();
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  }

  // 6. 吹き出し内質問カード＆回答入力エリアのレンダリング
  function renderBubbleQuestions() {
    if (!questionListContainer) return;

    const centerChar = getCharacterById(selectedCharId);
    
    // 現在選択中のキャラクター宛ての質問を抽出
    let filtered = questionsData.filter(q => Number(q.character) === Number(selectedCharId));

    if (currentFilter === 'pending') {
      filtered = filtered.filter(q => !q.answer && !q.isPopped);
    } else if (currentFilter === 'answered') {
      filtered = filtered.filter(q => !!q.answer);
    }

    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    questionListContainer.innerHTML = '';

    if (filtered.length === 0) {
      questionListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 40px;">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">💬</div>
          <p style="font-weight: 700;">${centerChar.name} 宛ての該当する質問はありません。</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const isPopped = item.isPopped || Number(item.tapCount || 0) >= 20;

      let statusBadge = '';
      if (isPopped) {
        statusBadge = `<span style="background:#EDF2F7; color:#8D99AE; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:800;">消滅済み</span>`;
      } else if (item.answer) {
        statusBadge = `<span style="background:#D3F9D8; color:#2B8A3E; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:800;">回答済み</span>`;
      } else {
        statusBadge = `<span style="background:#FFF3BF; color:#F59F00; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:800;">未回答</span>`;
      }

      const card = document.createElement('div');
      card.className = 'admin-question-item';
      card.innerHTML = `
        <div class="item-meta">
          <span>ID: ${escapeHTML(String(item.id))}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color: var(--primary-color);">タップ数: ${item.tapCount || 0}/20</span>
            ${statusBadge}
          </div>
        </div>

        <div class="item-q-text">
          ${escapeHTML(item.question)}
        </div>

        <div class="item-answer-row">
          <textarea class="item-answer-input" id="ans-${item.id}" placeholder="回答を入力してください...">${escapeHTML(item.answer || '')}</textarea>
          <button type="button" class="btn-save-answer" data-id="${item.id}">保存</button>
        </div>
      `;

      const saveBtn = card.querySelector('.btn-save-answer');
      saveBtn.addEventListener('click', async () => {
        const textarea = document.getElementById(`ans-${item.id}`);
        const newAns = textarea.value;

        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        try {
          const res = await balloonApi.updateAnswer(item.id, newAns);
          if (res && res.status === 'success') {
            saveBtn.textContent = '完了! ✨';
            setTimeout(() => {
              saveBtn.disabled = false;
              saveBtn.textContent = '保存';
              loadQuestions();
            }, 700);
          } else {
            alert('保存に失敗しました。');
            saveBtn.disabled = false;
            saveBtn.textContent = '保存';
          }
        } catch (err) {
          console.error(err);
          alert('エラーが発生しました。');
          saveBtn.disabled = false;
          saveBtn.textContent = '保存';
        }
      });

      questionListContainer.appendChild(card);
    });
  }

  // 7. モーダル
  btnOpenConfig.addEventListener('click', () => {
    gasUrlInput.value = balloonApi.getGasUrl();
    configModal.classList.add('open');
  });

  btnCloseConfig.addEventListener('click', () => {
    configModal.classList.remove('open');
  });

  btnSaveConfig.addEventListener('click', () => {
    balloonApi.setGasUrl(gasUrlInput.value);
    configModal.classList.remove('open');
    loadQuestions();
  });

  btnResetMock.addEventListener('click', () => {
    if (confirm('モック用データを初期化しますか？')) {
      balloonApi.resetMockData();
      loadQuestions();
    }
  });

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
