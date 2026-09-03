/**
 * GAS (Google Apps Script) および LocalStorage モック API 通信管理クラス
 */

const STORAGE_KEY_GAS_URL = 'balloon_qa_gas_url';
const STORAGE_KEY_MOCK_DATA = 'balloon_qa_mock_data';

// 初期モックデータ（デモ表示用）
const INITIAL_MOCK_DATA = [
  {
    id: "q_101",
    character: 1,
    question: "好きな食べ物は何ですか？おすすめを教えてください！",
    answer: "ハチミツが大好きです！特に春のレンゲハチミツが最高ですよ。",
    tapCount: 8,
    isPopped: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "q_102",
    character: 2,
    question: "風船は何個まで同時に浮かせることができますか？",
    answer: "",
    tapCount: 3,
    isPopped: false,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: "q_103",
    character: 3,
    question: "今日のイベントで一番楽しみにしているプログラムは？",
    answer: "みんなで風船をタップして割るフィナーレです！",
    tapCount: 19,
    isPopped: false,
    createdAt: new Date(Date.now() - 900000).toISOString()
  }
];

class BalloonApi {
  constructor() {
    this.gasUrl = localStorage.getItem(STORAGE_KEY_GAS_URL) || '';
    this.initMockDataIfNeeded();
  }

  getGasUrl() {
    return this.gasUrl;
  }

  setGasUrl(url) {
    this.gasUrl = url.trim();
    if (this.gasUrl) {
      localStorage.setItem(STORAGE_KEY_GAS_URL, this.gasUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_GAS_URL);
    }
  }

  initMockDataIfNeeded() {
    if (!localStorage.getItem(STORAGE_KEY_MOCK_DATA)) {
      localStorage.setItem(STORAGE_KEY_MOCK_DATA, JSON.stringify(INITIAL_MOCK_DATA));
    }
  }

  /**
   * 全質問データを取得
   */
  async fetchQuestions() {
    if (this.gasUrl) {
      try {
        const response = await fetch(this.gasUrl, { method: 'GET' });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          return result.data;
        }
      } catch (err) {
        console.warn('GAS fetch error, fallback to mock data:', err);
      }
    }
    // モックデータ返却
    const raw = localStorage.getItem(STORAGE_KEY_MOCK_DATA);
    return raw ? JSON.parse(raw) : [];
  }

  /**
   * 新しい質問を送信
   */
  async createQuestion(characterId, questionText) {
    const payload = {
      action: 'create',
      character: parseInt(characterId, 10),
      question: questionText.trim()
    };

    if (this.gasUrl) {
      try {
        const response = await fetch(this.gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.status === 'success') {
          return result;
        }
      } catch (err) {
        console.warn('GAS POST create error, fallback to local mock:', err);
      }
    }

    // モックでの作成処理
    const currentData = await this.fetchQuestions();
    const newQuestion = {
      id: 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      character: payload.character,
      question: payload.question,
      answer: '',
      tapCount: 0,
      isPopped: false,
      createdAt: new Date().toISOString()
    };
    currentData.push(newQuestion);
    localStorage.setItem(STORAGE_KEY_MOCK_DATA, JSON.stringify(currentData));
    return { status: 'success', data: newQuestion };
  }

  /**
   * 風船がタップされた時のカウントアップ
   */
  async recordTap(questionId) {
    const payload = {
      action: 'tap',
      id: questionId
    };

    if (this.gasUrl) {
      try {
        const response = await fetch(this.gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.status === 'success') {
          return result;
        }
      } catch (err) {
        console.warn('GAS POST tap error, fallback to local mock:', err);
      }
    }

    // モックでのタップ更新
    const currentData = await this.fetchQuestions();
    const item = currentData.find(q => String(q.id) === String(questionId));
    if (item) {
      item.tapCount = (item.tapCount || 0) + 1;
      if (item.tapCount >= 20) {
        item.isPopped = true;
      }
      localStorage.setItem(STORAGE_KEY_MOCK_DATA, JSON.stringify(currentData));
      return { status: 'success', data: item };
    }
    return { status: 'error', message: 'Question not found' };
  }

  /**
   * 運営による回答の保存・更新
   */
  async updateAnswer(questionId, answerText) {
    const payload = {
      action: 'answer',
      id: questionId,
      answer: answerText.trim()
    };

    if (this.gasUrl) {
      try {
        const response = await fetch(this.gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.status === 'success') {
          return result;
        }
      } catch (err) {
        console.warn('GAS POST answer error, fallback to local mock:', err);
      }
    }

    // モックでの回答更新
    const currentData = await this.fetchQuestions();
    const item = currentData.find(q => String(q.id) === String(questionId));
    if (item) {
      item.answer = payload.answer;
      localStorage.setItem(STORAGE_KEY_MOCK_DATA, JSON.stringify(currentData));
      return { status: 'success', data: item };
    }
    return { status: 'error', message: 'Question not found' };
  }

  /**
   * モックデータの初期リセット
   */
  resetMockData() {
    localStorage.setItem(STORAGE_KEY_MOCK_DATA, JSON.stringify(INITIAL_MOCK_DATA));
  }
}

const balloonApi = new BalloonApi();
