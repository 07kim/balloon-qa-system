/**
 * iPad向け運営管理画面 (admin.html) メインスクリプト
 * 上半分：横ボタン切り替え式キャラクターセレクター
 * 下半分：選択中キャラクターの質問一覧 ＆ 回答入力フォーム
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM参照
  const track = document.getElementById('char-carousel-track');
  const btnPrev = document.getElementById('btn-char-prev');
  const btnNext = document.getElementById('btn-char-next');
  
  const questionGrid = document.getElementById('ipad-question-grid');
  const bannerIcon = document.getElementById('banner-char-icon');
  const bannerName = document.getElementById('banner-char-name');
  const bannerStats = document.getElementById('banner-char-stats');
  
  const btnRefresh = document.getElementById('btn-refresh');
  const filterBtns = document.querySelectorAll('.btn-filter');
  const apiStatusText = document.getElementById('api-status-text');
  
  const btnOpenConfig = document.getElementById('btn-open-config');
  const configModal = document.getElementById('config-modal');
  const btnCloseConfig = document.getElementById('btn-close-config');
  const gasUrlInput = document.getElementById('gas-url-input');
  const btnSaveConfig = document.getElementById('btn-save-config');
  const btnResetMock = document.getElementById('btn-reset-mock');

  // 内部状態
  let questionsData = [];
  let selectedCharId = 'all'; // 'all' または 1〜10
  let currentFilter = 'all';  // 'all', 'pending', 'answered', 'popped'

  // 1. 初期ロード
  updateApiStatusDisplay();
  loadAndRenderAll();

  // 定期自動更新（5秒間隔）
  setInterval(loadAndRenderAll, 5000);

  // リフレッシュボタン
  btnRefresh.addEventListener('click', () => {
    loadAndRenderAll();
  });

  // 左右横ボタンのイベント (◀ ▶)
  btnPrev.addEventListener('click', () => {
    navigateCharacter(-1);
  });

  btnNext.addEventListener('click', () => {
    navigateCharacter(1);
  });

  // フィルター切り替えボタン
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterVal = btn.getAttribute('data-filter');
      if (filterVal) {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = filterVal;
        renderBottomSection();
      }
    });
  });

  // データを取得して全体を再描画
  async function loadAndRenderAll() {
    try {
      questionsData = await balloonApi.fetchQuestions();
      renderTopCarousel();
      renderBottomSection();
    } catch (err) {
      console.error('Failed to fetch questions in admin:', err);
    }
  }

  // ==========================================================================
  // 【上半分】キャラクター横切り替えトラックのレンダリング
  // ==========================================================================
  function renderTopCarousel() {
    if (!track) return;

    // 現在のスクロール位置を保持
    const scrollLeft = track.scrollLeft;
    track.innerHTML = '';

    // 0. 「すべてのキャラ」カード
    const allPendingCount = questionsData.filter(q => !q.answer && !q.isPopped).length;
    const allCard = document.createElement('div');
    allCard.className = `admin-char-card ${selectedCharId === 'all' ? 'active' : ''}`;
    allCard.setAttribute('data-id', 'all');
    allCard.innerHTML = `
      <div style="font-size: 1.8rem; margin: 4px 0;">🌈</div>
      <span class="character-name">すべて</span>
      ${allPendingCount > 0 ? `<div class="admin-char-badge">${allPendingCount}</div>` : ''}
    `;
    allCard.addEventListener('click', () => selectCharacter('all'));
    track.appendChild(allCard);

    // 1~10のキャラクターカード
    CHARACTERS.forEach(char => {
      const pendingCount = questionsData.filter(q => Number(q.character) === char.id && !q.answer && !q.isPopped).length;
      
      const card = document.createElement('div');
      card.className = `admin-char-card ${String(selectedCharId) === String(char.id) ? 'active' : ''}`;
      card.setAttribute('data-id', char.id);
      card.innerHTML = `
        <div class="character-avatar">${char.icon}</div>
        <span class="character-name">${char.name}</span>
        ${pendingCount > 0 ? `<div class="admin-char-badge">${pendingCount}</div>` : ''}
      `;
      card.addEventListener('click', () => selectCharacter(char.id));
      track.appendChild(card);
    });

    track.scrollLeft = scrollLeft;
  }

  // キャラクター切替処理
  function selectCharacter(charId) {
    selectedCharId = charId;
    renderTopCarousel();
    renderBottomSection();
    scrollToActiveCharCard();
  }

  // 左右ボタン (◀ ▶) による順番切替
  function navigateCharacter(direction) {
    const list = ['all', ...CHARACTERS.map(c => c.id)];
    let currentIndex = list.findIndex(id => String(id) === String(selectedCharId));
    if (currentIndex === -1) currentIndex = 0;

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = list.length - 1;
    if (newIndex >= list.length) newIndex = 0;

    selectCharacter(list[newIndex]);
  }

  // 選択されたカードへ自動スクロール
  function scrollToActiveCharCard() {
    const activeCard = track.querySelector('.admin-char-card.active');
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  // ==========================================================================
  // 【下半分】選択キャラクターの質問リスト＆回答入力フォームのレンダリング
  // ==========================================================================
  function renderBottomSection() {
    if (!questionGrid) return;

    // 1. バナーのアップデート
    if (selectedCharId === 'all') {
      bannerIcon.innerHTML = '🌈';
      bannerName.textContent = 'すべてのキャラクター';
    } else {
      const char = getCharacterById(selectedCharId);
      bannerIcon.innerHTML = char.icon;
      bannerName.textContent = char.name;
    }

    // 質問データの抽出
    let filtered = questionsData;
    if (selectedCharId !== 'all') {
      filtered = filtered.filter(q => Number(q.character) === Number(selectedCharId));
    }

    // フィルタ条件
    if (currentFilter === 'pending') {
      filtered = filtered.filter(q => !q.answer && !q.isPopped);
    } else if (currentFilter === 'answered') {
      filtered = filtered.filter(q => !!q.answer && !q.isPopped);
    } else if (currentFilter === 'popped') {
      filtered = filtered.filter(q => q.isPopped || Number(q.tapCount || 0) >= 20);
    }

    // 時系列降順 (新しい順)
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const totalCount = questionsData.filter(q => selectedCharId === 'all' || Number(q.character) === Number(selectedCharId)).length;
    const pendingCount = questionsData.filter(q => (selectedCharId === 'all' || Number(q.character) === Number(selectedCharId)) && !q.answer && !q.isPopped).length;
    bannerStats.textContent = `全質問: ${totalCount} 件 | 未回答: ${pendingCount} 件`;

    questionGrid.innerHTML = '';

    if (filtered.length === 0) {
      questionGrid.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 48px; background: #F8FAFC; border-radius: var(--radius-md);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">💬</div>
          <p style="font-weight: 700;">該当する質問はありません。</p>
        </div>
      `;
      return;
    }

    // 質問カードのレンダリング
    filtered.forEach(item => {
      const char = getCharacterById(item.character);
      const isPopped = item.isPopped || Number(item.tapCount || 0) >= 20;

      let statusBadgeHTML = '';
      if (isPopped) {
        statusBadgeHTML = `<span class="status-badge popped">消滅済み (20タップ)</span>`;
      } else if (item.answer) {
        statusBadgeHTML = `<span class="status-badge answered">回答済み</span>`;
      } else {
        statusBadgeHTML = `<span class="status-badge pending">未回答</span>`;
      }

      const card = document.createElement('div');
      card.className = 'ipad-question-card';
      card.innerHTML = `
        <div class="card-top-info">
          <div style="display:flex; align-items:center; gap: 8px;">
            <div style="width:24px; height:24px;">${char.icon}</div>
            <span style="font-weight:800; color: var(--text-main);">${char.name}</span>
            <span style="font-size:0.75rem; color: var(--text-muted);">ID: ${escapeHTML(String(item.id))}</span>
          </div>
          <div style="display:flex; align-items:center; gap: 12px;">
            <span style="font-weight:700; color: var(--primary-color);">タップ数: ${item.tapCount || 0}/20</span>
            ${statusBadgeHTML}
          </div>
        </div>

        <div class="card-question-text">
          ${escapeHTML(item.question)}
        </div>

        <div class="card-answer-form">
          <textarea class="card-answer-textarea" id="textarea-ans-${item.id}" placeholder="運営からの回答を入力してください...">${escapeHTML(item.answer || '')}</textarea>
          <button type="button" class="btn-save-ipad" data-id="${item.id}">回答を保存</button>
        </div>
      `;

      // 保存ボタン処理
      const saveBtn = card.querySelector('.btn-save-ipad');
      saveBtn.addEventListener('click', async () => {
        const textarea = document.getElementById(`textarea-ans-${item.id}`);
        const newAns = textarea.value;

        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        try {
          const res = await balloonApi.updateAnswer(item.id, newAns);
          if (res && res.status === 'success') {
            saveBtn.textContent = '保存完了! ✨';
            setTimeout(() => {
              saveBtn.disabled = false;
              saveBtn.textContent = '回答を保存';
              loadAndRenderAll();
            }, 800);
          } else {
            alert('保存に失敗しました。');
            saveBtn.disabled = false;
            saveBtn.textContent = '回答を保存';
          }
        } catch (err) {
          console.error(err);
          alert('エラーが発生しました。');
          saveBtn.disabled = false;
          saveBtn.textContent = '回答を保存';
        }
      });

      questionGrid.appendChild(card);
    });
  }

  // モーダル・設定制御
  btnOpenConfig.addEventListener('click', () => {
    gasUrlInput.value = balloonApi.getGasUrl();
    configModal.classList.add('open');
  });

  btnCloseConfig.addEventListener('click', () => {
    configModal.classList.remove('open');
  });

  btnSaveConfig.addEventListener('click', () => {
    const url = gasUrlInput.value;
    balloonApi.setGasUrl(url);
    updateApiStatusDisplay();
    configModal.classList.remove('open');
    loadAndRenderAll();
  });

  btnResetMock.addEventListener('click', () => {
    if (confirm('モック用テストデータを初期状態にリセットしますか？')) {
      balloonApi.resetMockData();
      loadAndRenderAll();
    }
  });

  function updateApiStatusDisplay() {
    const url = balloonApi.getGasUrl();
    if (url) {
      apiStatusText.textContent = `GAS URL設定済み`;
      apiStatusText.style.color = '#2B8A3E';
    } else {
      apiStatusText.textContent = `ローカルモック動作中`;
      apiStatusText.style.color = '#E03131';
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
