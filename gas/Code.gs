/**
 * インタラクティブ・バルーンQ&Aシステム Google Apps Script (GAS) バックエンドコード
 * 
 * スプレッドシート定義:
 * - A列: ID (一意の文字列)
 * - B列: キャラクター (1〜10)
 * - C列: 質問内容 (テキスト)
 * - D列: 回答内容 (テキスト)
 * - E列: タップ数 (数値, 初期値 0)
 * - F列: 消滅フラグ (BOOLEAN, 初期値 FALSE)
 * - G列: 送信日時 (ISO文字列/タイムスタンプ)
 */

// スプレッドシート名 (デフォルト: シート1)
const SHEET_NAME = 'シート1';

/**
 * GET リクエスト処理 (全質問データ取得)
 */
function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行を除外
    const rows = data.slice(1);
    const questions = rows.map(row => {
      return {
        id: String(row[0]),
        character: Number(row[1]),
        question: String(row[2] || ''),
        answer: String(row[3] || ''),
        tapCount: Number(row[4] || 0),
        isPopped: Boolean(row[5]),
        createdAt: row[6] ? new Date(row[6]).toISOString() : ''
      };
    });

    return createJsonResponse({
      status: 'success',
      data: questions
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * POST リクエスト処理 (質問送信・タップカウント・回答更新)
 */
function doPost(e) {
  // 非機能要件: 複数人が同時に同じ風船をタップした際のカウントずれを防ぐ排他制御 (LockService)
  const lock = LockService.getScriptLock();
  // 最大10秒間ロック獲得を試みる
  const hasLock = lock.tryLock(10000);

  if (!hasLock) {
    return createJsonResponse({
      status: 'error',
      message: 'Server busy, lock timeout. Please retry.'
    });
  }

  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    const action = postData.action;
    const sheet = getSheet();

    if (action === 'create') {
      // 1. 質問送信
      const newId = 'q_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
      const character = Number(postData.character) || 1;
      const question = String(postData.question || '').trim();
      const answer = '';
      const tapCount = 0;
      const isPopped = false;
      const createdAt = new Date().toISOString();

      sheet.appendRow([newId, character, question, answer, tapCount, isPopped, createdAt]);

      return createJsonResponse({
        status: 'success',
        data: { id: newId, character, question, answer, tapCount, isPopped, createdAt }
      });

    } else if (action === 'tap') {
      // 2. タップ数カウントアップ (排他制御済み)
      const targetId = String(postData.id);
      const data = sheet.getDataRange().getValues();
      
      let targetRowIndex = -1;
      let currentTapCount = 0;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === targetId) {
          targetRowIndex = i + 1; // 1-indexed (シートの行番号)
          currentTapCount = Number(data[i][4] || 0);
          break;
        }
      }

      if (targetRowIndex !== -1) {
        const updatedTapCount = currentTapCount + 1;
        const isPopped = updatedTapCount >= 20;

        // E列(タップ数), F列(消滅フラグ)を更新
        sheet.getRange(targetRowIndex, 5).setValue(updatedTapCount);
        sheet.getRange(targetRowIndex, 6).setValue(isPopped);

        return createJsonResponse({
          status: 'success',
          data: { id: targetId, tapCount: updatedTapCount, isPopped: isPopped }
        });
      } else {
        return createJsonResponse({ status: 'error', message: 'Target question ID not found' });
      }

    } else if (action === 'answer') {
      // 3. 運営による回答入力・更新
      const targetId = String(postData.id);
      const answerText = String(postData.answer || '').trim();
      const data = sheet.getDataRange().getValues();

      let targetRowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === targetId) {
          targetRowIndex = i + 1;
          break;
        }
      }

      if (targetRowIndex !== -1) {
        // D列(回答内容)を更新
        sheet.getRange(targetRowIndex, 4).setValue(answerText);
        return createJsonResponse({
          status: 'success',
          data: { id: targetId, answer: answerText }
        });
      } else {
        return createJsonResponse({ status: 'error', message: 'Target question ID not found' });
      }

    } else {
      return createJsonResponse({ status: 'error', message: 'Invalid action' });
    }

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  } finally {
    // ロック解除
    lock.releaseLock();
  }
}

/**
 * ユーティリティ: スプレッドシートとヘッダー初期化
 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // 1行目が空の場合ヘッダーを作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'キャラクター', '質問内容', '回答内容', 'タップ数', '消滅フラグ', '送信日時']);
  }
  return sheet;
}

/**
 * ユーティリティ: JSONレスポンスの生成 (CORS対応)
 */
function createJsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
