// ---------------------------
// 初期設定：期限に今日の日付をセット
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    document.getElementById("deadline").value = todayStr;

    loadTasks();     // ← ローカルストレージから復元
    renderTables();  // ← テーブル描画
});

let tasks = [];
let taskId = 1;

// ---------------------------
// ローカルストレージ保存
// ---------------------------
function saveTasks() {
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

// ---------------------------
// ローカルストレージ読み込み
// ---------------------------
function loadTasks() {
    const json = localStorage.getItem("todoTasks");
    if (json) {
        tasks = JSON.parse(json);

        // 最大IDを計算し taskId に設定
        if (tasks.length > 0) {
            taskId = Math.max(...tasks.map(t => t.id)) + 1;
        }
    }
}

// ---------------------------
// タスク追加
// ---------------------------
document.getElementById("addTaskBtn").addEventListener("click", () => {
    const name = document.getElementById("taskName").value.trim();
    const deadline = document.getElementById("deadline").value;
    const isImportant = document.getElementById("isImportant").checked;
    const memo = document.getElementById("taskMemo").value.trim();

    if (!name) {
        alert("タスク名を入力してください");
        return;
    }

    const today = new Date().toISOString().split("T")[0];

    const task = {
        id: taskId++,
        name,
        deadline,
        registerDate: today,
        important: isImportant,
        memo,
        status: "not_started"
    };

    tasks.push(task);
    saveTasks();     // ← データ保存
    renderTables();

    // 入力初期化
    document.getElementById("taskName").value = "";
    document.getElementById("taskMemo").value = "";
    document.getElementById("isImportant").checked = false;
});

// ---------------------------
// タブ切替
// ---------------------------
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.dataset.tab;
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        document.getElementById(tab).classList.add("active");
    });
});

// ---------------------------
// テーブル描画
// ---------------------------
function renderTables() {
    const workingBody = document.getElementById("workingBody");
    const doneBody = document.getElementById("doneBody");

    workingBody.innerHTML = "";
    doneBody.innerHTML = "";

    tasks.forEach(task => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${task.name}</td>
            <td>${task.registerDate} ～ ${task.deadline}</td>
            <td>${task.important ? "重要" : ""}</td>
            <td>
                ${task.status === "done" 
                    ? "完了" 
                    : `
                    <select data-id="${task.id}" class="statusSel">
                        <option value="not_started" ${task.status === "not_started" ? "selected" : ""}>未着手</option>
                        <option value="doing" ${task.status === "doing" ? "selected" : ""}>着手中</option>
                    </select>
                `}
            </td>
            <td>${task.memo}</td>
            <td><button disabled>追加予定</button></td>
            <td>
                ${task.status !== "done" ? `<button class="doneBtn" data-id="${task.id}">完了</button>` : ""}
                <button class="deleteBtn" data-id="${task.id}">削除</button>
            </td>
        `;

        if (task.status === "done") {
            doneBody.appendChild(row);
        } else {
            workingBody.appendChild(row);
        }
    });

    // ▶ 作業状況変更イベント
    document.querySelectorAll(".statusSel").forEach(sel => {
        sel.addEventListener("change", () => {
            const id = Number(sel.dataset.id);
            const t = tasks.find(x => x.id === id);
            t.status = sel.value;
            saveTasks();   // ← 状態変更のたび保存
        });
    });

    // ▶ 完了ボタン
    document.querySelectorAll(".doneBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            const t = tasks.find(x => x.id === id);
            t.status = "done";
            saveTasks();  // ← 保存
            renderTables();
        });
    });

    // ▶ 削除ボタン
    document.querySelectorAll(".deleteBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            tasks = tasks.filter(x => x.id !== id);
            saveTasks();  // ← 保存
            renderTables();
        });
    });
}
