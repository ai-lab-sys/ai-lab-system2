// ---------------------------
// 初期設定：期限に今日の日付をセット
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    document.getElementById("deadline").value = todayStr;

    loadTasks();
    renderTables();
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

        tasks.forEach(t => {
            if (!t.remarks) t.remarks = [];
            if (!t.memo) t.memo = "";
        });

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
        remarks: [],
        status: "not_started"
    };

    tasks.push(task);
    saveTasks();
    renderTables();

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

        // 日付表示（1日なら「～」省略）
        let dateDisplay = (task.registerDate === task.deadline) 
            ? task.deadline 
            : `${task.registerDate} ～ ${task.deadline}`;

        const row = document.createElement("tr");

        // 備考リスト（task.memo + remarks）を li + 削除ボタン付きで生成
        const remarksHtml = [];

        if (task.memo) {
            remarksHtml.push(
                `<li>${task.memo} <button class="deleteRemarkBtn" data-taskid="${task.id}" data-index="0">削除</button></li>`
            );
        }
        task.remarks.forEach((r, i) => {
            const index = task.memo ? i + 1 : i;
            remarksHtml.push(
                `<li>${r} <button class="deleteRemarkBtn" data-taskid="${task.id}" data-index="${index}">削除</button></li>`
            );
        });

        // ---------------------------
        // 作業中タスク
        // ---------------------------
        if (task.status !== "done") {
            row.innerHTML = `
                <td>${task.name}</td>
                <td>${dateDisplay}</td>
                <td>${task.important ? "重要" : ""}</td>

                <td>
                    <select data-id="${task.id}" class="statusSel">
                        <option value="not_started" ${task.status === "not_started" ? "selected" : ""}>未着手</option>
                        <option value="doing" ${task.status === "doing" ? "selected" : ""}>着手中</option>
                    </select>
                </td>

                <td>
                    <ul class="remarks-list">${remarksHtml.join("")}</ul>
                </td>

                <td>
                    <button class="toggleRemarkInputBtn" data-id="${task.id}">備考追加</button>
                    <div class="remarkInputArea" id="remarkArea-${task.id}" style="display:none;">
                        <input type="text" class="remarkInput" data-id="${task.id}" placeholder="追加内容">
                        <button class="addRemarkBtn" data-id="${task.id}">追加</button>
                    </div>
                </td>

                <td>
                    <button class="doneBtn" data-id="${task.id}">完了</button>
                    <button class="deleteBtn" data-id="${task.id}">削除</button>
                </td>
            `;

            workingBody.appendChild(row);
        } 
        // ---------------------------
        // 完了タスク
        // ---------------------------
        else {
            row.innerHTML = `
                <td>${task.name}</td>
                <td>${dateDisplay}</td>
                <td>${task.important ? "重要" : ""}</td>
                <td>完了</td>
                <td>
                    <ul class="remarks-list">${remarksHtml.join("")}</ul>
                </td>
                <td>
                    <button class="deleteBtn" data-id="${task.id}">削除</button>
                </td>
            `;
            doneBody.appendChild(row);
        }
    });

    // ---------------------------
    // イベント設定
    // ---------------------------

    // 作業状況変更
    document.querySelectorAll(".statusSel").forEach(sel => {
        sel.addEventListener("change", () => {
            const t = tasks.find(x => x.id === Number(sel.dataset.id));
            t.status = sel.value;
            saveTasks();
        });
    });

    // 完了
    document.querySelectorAll(".doneBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const t = tasks.find(x => x.id === Number(btn.dataset.id));
            t.status = "done";
            saveTasks();
            renderTables();
        });
    });

    // 削除（タスク）
    document.querySelectorAll(".deleteBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            if (!confirm("本当にこのタスクを削除しますか？")) return;
            tasks = tasks.filter(x => x.id !== id);
            saveTasks();
            renderTables();
        });
    });

    // 備考入力欄の表示 / 非表示
    document.querySelectorAll(".toggleRemarkInputBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const area = document.getElementById(`remarkArea-${btn.dataset.id}`);
            area.style.display = (area.style.display === "none") ? "block" : "none";
        });
    });

    // 備考追加
    document.querySelectorAll(".addRemarkBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const t = tasks.find(x => x.id === Number(btn.dataset.id));
            const input = document.querySelector(`.remarkInput[data-id="${t.id}"]`);
            const text = input.value.trim();
            if (!text) return;

            t.remarks.push(text);
            input.value = "";
            saveTasks();
            renderTables();
        });
    });

    // 備考削除（各 li 内の削除ボタン）
    document.querySelectorAll(".deleteRemarkBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const taskId = Number(btn.dataset.taskid);
            const index = Number(btn.dataset.index);
            if (!confirm("本当にこの備考を削除しますか？")) return;

            const t = tasks.find(x => x.id === taskId);

            // task.memo の場合（最初の項目）
            if (t.memo && index === 0) {
                t.memo = "";
            } else {
                const adjustedIndex = t.memo ? index - 1 : index;
                t.remarks.splice(adjustedIndex, 1);
            }

            saveTasks();
            renderTables();
        });
    });
}
