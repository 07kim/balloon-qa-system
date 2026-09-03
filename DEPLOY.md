# GitHub & Vercel & Googleスプレッドシート(DB) 完全デプロイマニュアル

このシステムは、**GitHub** でコードを管理し、**Vercel** で高速なWebサイトとして公開し、**Google スプレッドシート** をデータベース (DB) として双方向リアルタイム連携させる構成となっています。

---

## 🛠️ 全体構成図

```
[ 参加者スマホ / iPad運営端末 ]
          │
          ▼
   Vercel (Webホスティング) ─── HTTPS API ───► Google Apps Script (GAS)
                                                      │
                                                      ▼
                                           Google スプレッドシート (DB)
```

---

## 【Step 1】Google スプレッドシート (DB) ＆ GAS のセットアップ

1. **Google ドライブ** で新規の **Google スプレッドシート** を作成します。
2. 上部メニューの **「拡張機能」 ➔ 「Apps Script」** をクリックします。
3. エディタ上のコードを消去し、このプロジェクトの [`gas/Code.gs`](gas/Code.gs) の内容をすべて貼り付けます。
4. 右上の **「デプロイ」 ➔ 「新しいデプロイ」** をクリックします。
5. 歯車アイコンから **「ウェブアプリ」** を選択し、以下のように設定します：
   - **説明**: `Balloon QA API`
   - **次のユーザーとして実行**: `自分`
   - **アクセスできるユーザー**: `全員` (重要: 認証なしでAPI通信できるようにするため)
6. **「デプロイ」** ボタンを押し、権限の承認を行います。
7. 発行された **「ウェブアプリ URL」** (`https://script.google.com/macros/s/AKfycbx.../exec`) をコピーして手元に控えておきます。

---

## 【Step 2】GitHub へのコードのプッシュ

1. **[GitHub](https://github.com/)** にログインし、右上「+」ボタンから **「New repository」** を作成します。
   - リポジトリ名例: `balloon-qa-system`
   - **Public** を選択
   - 「Add a README file」等のチェックは入れずに **「Create repository」** をクリックします。
2. お手元のターミナルで以下のコマンドを実行し、GitHubへプッシュします：

```bash
# 1. 変更をコミット
git add .
git commit -m "Initial commit for Balloon QA System"

# 2. ブランチ名を main に設定
git branch -M main

# 3. GitHubのリポジトリURLを設定 (YOUR_USERNAME をご自身のアカウント名に変更)
git remote add origin https://github.com/YOUR_USERNAME/balloon-qa-system.git

# 4. GitHubへ送信
git push -u origin main
```

---

## 【Step 3】Vercel へのワンクリックデプロイ

1. **[Vercel](https://vercel.com/)** にログイン（GitHubアカウントでサインイン）します。
2. ダッシュボードの **「Add New...」 ➔ 「Project」** を選択します。
3. 先ほどGitHubに作成した `balloon-qa-system` リポジトリの横にある **「Import」** をクリックします。
4. 設定はデフォルトのままで **「Deploy」** ボタンを押します。
5. 約10〜20秒でデプロイが完了し、本番WebサイトのURL（例: `https://balloon-qa-system.vercel.app`）が発行されます！

---

## 【Step 4】本番VercelサイトとGoogleスプレッドシート(DB)の接続

1. 公開された Vercel の管理画面 URL（例: `https://balloon-qa-system.vercel.app/admin`）をiPadやPCブラウザで開きます。
2. ヘッダー右上の **「API・GAS設定 ⚙️」** ボタンをクリックします。
3. **【Step 1】** で取得した GAS の 「ウェブアプリ URL」 を貼り付け、**「設定を保存」** を押します。
4. これで、**全世界の参加者のスマートフォン端末** と **Google スプレッドシート** がリアルタイムに双方向データベース連携されます！🎉
