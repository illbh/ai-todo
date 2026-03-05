// ========================================
// TODOアプリ - app.js
// ========================================

// --------------------------------------------------
// 1. データ管理
//    TODOリストはlocalStorageに保存して、
//    ページを閉じても消えないようにします
// --------------------------------------------------

/**
 * localStorageからTODOリストを読み込む
 * JSONという文字列形式で保存しているので、配列に戻す
 */
function loadTodos() {
  const saved = localStorage.getItem('todos');
  // 保存データがなければ空の配列を返す
  return saved ? JSON.parse(saved) : [];
}

/**
 * TODOリストをlocalStorageに保存する
 * 配列をJSON文字列に変換して保存する
 */
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// アプリ起動時にlocalStorageからデータを読み込む
let todos = loadTodos();

// 現在のフィルター状態（'all' / 'active' / 'done'）
let currentFilter = 'all';

// --------------------------------------------------
// 2. HTML要素の取得
//    document.getElementById() でHTMLの要素を取得する
// --------------------------------------------------

const todoInput    = document.getElementById('todo-input');
const addBtn       = document.getElementById('add-btn');
const todoList     = document.getElementById('todo-list');
const taskCount    = document.getElementById('task-count');
const clearDoneBtn = document.getElementById('clear-done-btn');
const filterBtns   = document.querySelectorAll('.filter-btn');

// --------------------------------------------------
// 3. TODOの追加
// --------------------------------------------------

/**
 * 新しいTODOを追加する関数
 */
function addTodo() {
  // 入力欄のテキストを取得（前後の空白を削除）
  const text = todoInput.value.trim();

  // 空のままなら何もしない
  if (text === '') return;

  // 新しいTODOオブジェクトを作成
  const newTodo = {
    id: Date.now(),    // 現在時刻をユニークなIDとして使う
    text: text,        // タスクの内容
    done: false,       // 完了フラグ（最初はfalse）
  };

  // 配列の先頭に追加（新しいものが上に表示される）
  todos.unshift(newTodo);

  // localStorageに保存
  saveTodos();

  // 入力欄を空にする
  todoInput.value = '';

  // 画面を更新する
  render();
}

// --------------------------------------------------
// 4. TODO完了チェックの切り替え
// --------------------------------------------------

/**
 * 指定したIDのTODOの完了状態を切り替える
 * @param {number} id - 切り替えるTODOのID
 */
function toggleTodo(id) {
  // 対象のTODOを探して、doneを反転させる（true → false, false → true）
  todos = todos.map(function(todo) {
    if (todo.id === id) {
      return { ...todo, done: !todo.done }; // スプレッド構文でコピーしながら変更
    }
    return todo;
  });

  saveTodos();
  render();
}

// --------------------------------------------------
// 5. TODOの削除
// --------------------------------------------------

/**
 * 指定したIDのTODOを削除する
 * @param {number} id - 削除するTODOのID
 */
function deleteTodo(id) {
  // filter()で対象以外のTODOだけ残す
  todos = todos.filter(function(todo) {
    return todo.id !== id;
  });

  saveTodos();
  render();
}

/**
 * 完了済みのTODOをまとめて削除する
 */
function clearDoneTodos() {
  // done が false のものだけ残す
  todos = todos.filter(function(todo) {
    return !todo.done;
  });

  saveTodos();
  render();
}

// --------------------------------------------------
// 6. フィルタリング
// --------------------------------------------------

/**
 * 現在のフィルター設定に応じてTODOリストを絞り込む
 * @returns {Array} 絞り込まれたTODO配列
 */
function getFilteredTodos() {
  if (currentFilter === 'active') {
    // 未完了のみ
    return todos.filter(function(todo) { return !todo.done; });
  } else if (currentFilter === 'done') {
    // 完了済みのみ
    return todos.filter(function(todo) { return todo.done; });
  }
  // 'all' の場合はすべて返す
  return todos;
}

// --------------------------------------------------
// 7. 画面の描画（render関数）
//    TODOの状態が変わるたびにこの関数を呼んで
//    画面を最新の状態に更新します
// --------------------------------------------------

/**
 * TODOリストを画面に描画する
 */
function render() {
  // フィルタリングされたTODOリストを取得
  const filtered = getFilteredTodos();

  // リストエリアをいったん空にする
  todoList.innerHTML = '';

  // 表示するTODOがない場合はメッセージを表示
  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'タスクがありません';
    todoList.appendChild(empty);
  }

  // TODOを1件ずつ画面に追加する
  filtered.forEach(function(todo) {
    // <li> 要素を作成
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    // チェックボックス部分
    const checkbox = document.createElement('div');
    checkbox.className = 'todo-checkbox' + (todo.done ? ' checked' : '');
    // クリックで完了状態を切り替え
    checkbox.addEventListener('click', function() {
      toggleTodo(todo.id);
    });

    // テキスト部分
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', '削除'); // アクセシビリティ対応
    // クリックで削除
    deleteBtn.addEventListener('click', function() {
      deleteTodo(todo.id);
    });

    // li の中に各要素を追加
    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);

    // リストに追加
    todoList.appendChild(li);
  });

  // タスク件数の更新（未完了のみカウント）
  const activeCount = todos.filter(function(t) { return !t.done; }).length;
  taskCount.textContent = activeCount + '件の未完了タスク';
}

// --------------------------------------------------
// 8. イベントリスナーの登録
//    ボタンクリックやキー入力に対する処理を登録する
// --------------------------------------------------

// 「追加」ボタンをクリックしたとき
addBtn.addEventListener('click', addTodo);

// 入力欄でEnterキーを押したとき
todoInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    addTodo();
  }
});

// フィルターボタンのクリック
filterBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    // 現在のフィルターを更新
    currentFilter = btn.getAttribute('data-filter');

    // 全ボタンの active クラスをリセット
    filterBtns.forEach(function(b) { b.classList.remove('active'); });

    // クリックされたボタンに active クラスを付ける
    btn.classList.add('active');

    render();
  });
});

// 「完了済みを削除」ボタン
clearDoneBtn.addEventListener('click', clearDoneTodos);

// --------------------------------------------------
// 9. 初期表示
//    ページ読み込み時に一度描画する
// --------------------------------------------------
render();
