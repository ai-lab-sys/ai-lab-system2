// ---------------------------
// 初期設定：期限に今日の日付をセット
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    document.getElementById("fromDate").value = todayStr;
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
            const newRemarks = [];

            // ★ fromDate補完（追加）
            if (!t.fromDate) t.fromDate = t.registerDate;

            // 古い memo を先頭の備考に統合
            if (t.memo) {
                newRemarks.push({ text: t.memo, done: false });
                t.memo = "";
            }

            // remarks 初期化（バグ修正）
            if (!Array.isArray(t.remarks)) {
                t.remarks = [];
            }

            // 旧式 remarks の変換
            t.remarks.forEach(r => {
                if (r && typeof r === "object" && "text" in r) {
                    newRemarks.push({ text: r.text, done: !!r.done });
                } else if (r) {
                    newRemarks.push({ text: r, done: false });
                }
            });

            t.remarks = newRemarks;

            // フォールバック値
            if (!t.registerDate) t.registerDate = new Date().toISOString().split("T")[0];
            if (!t.deadline) t.deadline = t.registerDate;
            if (typeof t.important !== "boolean") t.important = false;
            if (!t.status) t.status = "not_started";
        });

        if (tasks.length > 0) {
            taskId = Math.max(...tasks.map(t => t.id)) + 1;
        }
    }
}

// ---------------------------
// タスク配列にフィルター適用
// ---------------------------
document.getElementById("sortExecBtn").addEventListener("click", () => {
    const resetChecked = document.getElementById("resetCheck").checked;

    if (resetChecked) {
        renderTables();
        return;
    }

    const deadlineVal = document.getElementById("deadlineSelect").value;
    const importantVal = document.querySelector('input[name="importantRadio"]:checked').value;

    let filteredTasks = [...tasks];

    if (deadlineVal) {
        const today = new Date();
        filteredTasks = filteredTasks.filter(t => {
            const deadlineDate = new Date(t.deadline);
            const diffDays = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= Number(deadlineVal);
        });
    }

    if (importantVal === "true") {
        filteredTasks = filteredTasks.filter(t => t.important === true);
    }

    renderTables(filteredTasks);
});

// ---------------------------
// タスク追加
// ---------------------------
document.getElementById("addTaskBtn").addEventListener("click", () => {
    const name = document.getElementById("taskName").value.trim();
    const fromDate = document.getElementById("fromDate").value; // ★追加
    const deadline = document.getElementById("deadline").value;
    const isImportant = document.getElementById("isImportant").checked;
    const memo = document.getElementById("taskMemo").value.trim();

    if (!name) {
        alert("タスク名を入力してください");
        return;
    }

    // ★ from > to チェック（追加）
    if (fromDate > deadline) {
        alert("開始日は期限より前にしてください");
        return;
    }

    const today = new Date().toISOString().split("T")[0];

    const initialRemarks = [];
    if (memo) initialRemarks.push({ text: memo, done: false });

    const task = {
        id: taskId++,
        name,
        deadline,
        fromDate, // ★追加
        registerDate: today,
        important: isImportant,
        memo: "",
        remarks: initialRemarks,
        status: "not_started"
    };

    tasks.unshift(task);
    saveTasks();
    renderTables();

    // 入力リセット
    document.getElementById("taskName").value = "";
    document.getElementById("taskMemo").value = "";
    document.getElementById("isImportant").checked = false;
    // 登録後、期限を今日に戻す
    document.getElementById("fromDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("deadline").value = new Date().toISOString().split("T")[0];
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
// テーブル描画（ソート対応版）
// taskList を指定しなければ従来通り tasks を描画
// ---------------------------
function renderTables(taskList = tasks) {
    const workingBody = document.getElementById("workingBody");
    const doneBody = document.getElementById("doneBody");

    workingBody.innerHTML = "";
    doneBody.innerHTML = "";

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    taskList.forEach(task => {

        // ★ 念のためフォールバック（安全対策）
        const fromDate = task.fromDate || task.registerDate;
        const deadline = task.deadline || fromDate;

        // 日付表示
        let dateDisplay = (fromDate === deadline)
            ? deadline
            : `${fromDate} ～ ${deadline}`;

        // 期日残り日数（日付だけで比較）
        const deadlineDate = new Date(deadline);
        const deadlineDateOnly = new Date(
            deadlineDate.getFullYear(),
            deadlineDate.getMonth(),
            deadlineDate.getDate()
        );

        let diffDays = Math.floor((deadlineDateOnly - todayDateOnly) / (1000 * 60 * 60 * 24));
        let dueClass = "due-normal";
        let dueText = diffDays + "日";

        if (diffDays < 0) {
            dueClass = "due-over";
            dueText = "期限超過";
        } else if (diffDays <= 3) {
            dueClass = "due-danger";
        } else if (diffDays <= 5) {
            dueClass = "due-warning";
        }

        const row = document.createElement("tr");

        // 備考リスト HTML
        const remarksHtml = (task.remarks || []).map((r, i) => {
            const checked = r.done ? "checked" : "";
            return `
                <li>
                    <label>
                        <input type="checkbox" class="remarkChk" data-taskid="${task.id}" data-index="${i}" ${checked}>
                        <span class="remarkText">${escapeHtml(r.text)}</span>
                    </label>
                </li>
            `;
        }).join("");

        // 一括削除ボタン
        const deleteSelectedBtnHtml = (task.remarks && task.remarks.length > 0)
            ? `<div class="remark-delete-area" style="text-align: right;">
                    <button class="deleteSelectedRemarksBtn" data-taskid="${task.id}">備考削除</button>
               </div>`
            : "";

        // ------- 作業中タスク -------
        if (task.status !== "done") {
            row.innerHTML = `
                <td>${escapeHtml(task.name)}</td>
                <td>${dateDisplay}</td>
                <td class="${dueClass}">${dueText}</td>
                <td>${task.important ? "重要" : ""}</td>
                <td>
                    <select data-id="${task.id}" class="statusSel">
                        <option value="not_started" ${task.status === "not_started" ? "selected" : ""}>未着手</option>
                        <option value="doing" ${task.status === "doing" ? "selected" : ""}>着手中</option>
                    </select>
                </td>
                <td>
                    <ul class="remarks-list">${remarksHtml}</ul>
                    ${deleteSelectedBtnHtml}
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

        // ------- 完了タスク -------
        else {
            row.innerHTML = `
                <td>${escapeHtml(task.name)}</td>
                <td>${dateDisplay}</td>
                <td>完了</td>
                <td>${task.important ? "重要" : ""}</td>
                <td>完了</td>
                <td>
                    <ul class="remarks-list">${remarksHtml}</ul>
                    ${deleteSelectedBtnHtml}
                </td>
                <td>
                    <button class="deleteBtn" data-id="${task.id}">削除</button>
                </td>
            `;
            doneBody.appendChild(row);
        }
    });

    // ---------------------------
    // 以下、イベント設定
    // ---------------------------

    // 状態変更
    document.querySelectorAll(".statusSel").forEach(sel => {
        sel.addEventListener("change", () => {
            const t = tasks.find(x => x.id === Number(sel.dataset.id));
            if (!t) return;
            t.status = sel.value;
            saveTasks();
            renderTables();
        });
    });

    // 完了
    document.querySelectorAll(".doneBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const t = tasks.find(x => x.id === Number(btn.dataset.id));
            if (!t) return;
            t.status = "done";
            saveTasks();
            renderTables();
        });
    });

        // タスク削除
    document.querySelectorAll(".deleteBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            if (!confirm("本当にこのタスクを削除しますか？")) return;

            tasks = tasks.filter(x => x.id !== id);
            saveTasks();
            renderTables();
        });
    });

    // 備考入力表示 ON/OFF
    document.querySelectorAll(".toggleRemarkInputBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const area = document.getElementById(`remarkArea-${btn.dataset.id}`);
            if (!area) return; // ★ 安全対策

            area.style.display = (area.style.display === "none") ? "block" : "none";
        });
    });

    // 備考追加
    document.querySelectorAll(".addRemarkBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const t = tasks.find(x => x.id === Number(btn.dataset.id));
            if (!t) return; // ★ 追加

            const input = document.querySelector(`.remarkInput[data-id="${t.id}"]`);
            if (!input) return; // ★ 追加

            const text = input.value.trim();
            if (!text) return;

            if (!Array.isArray(t.remarks)) {
                t.remarks = []; // ★ 念のため
            }

            t.remarks.push({ text: text, done: false });
            input.value = "";

            saveTasks();
            renderTables();
        });
    });

    // 備考チェック
    document.querySelectorAll(".remarkChk").forEach(chk => {
        chk.addEventListener("change", () => {
            const taskId = Number(chk.dataset.taskid);
            const index = Number(chk.dataset.index);

            const t = tasks.find(x => x.id === taskId);
            if (!t || !Array.isArray(t.remarks) || !t.remarks[index]) return; // ★ 強化

            t.remarks[index].done = chk.checked;
            saveTasks();
        });
    });

    // 備考一括削除
    document.querySelectorAll(".deleteSelectedRemarksBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const taskId = Number(btn.dataset.taskid);
            const t = tasks.find(x => x.id === taskId);
            if (!t || !Array.isArray(t.remarks)) return; // ★ 強化

            const checks = Array.from(
                document.querySelectorAll(`.remarkChk[data-taskid="${taskId}"]`)
            );

            const deleteIndexes = checks
                .map(c => ({ idx: Number(c.dataset.index), checked: c.checked }))
                .filter(x => x.checked)
                .map(x => x.idx);

            if (deleteIndexes.length === 0) {
                alert("削除する項目を選択してください");
                return;
            }

            if (!confirm("選択した備考を削除しますか？")) return;

            // 後ろから削除（インデックスずれ防止）
            deleteIndexes.sort((a, b) => b - a).forEach(i => {
                t.remarks.splice(i, 1);
            });

            saveTasks();
            renderTables();
        });
    });
}


// ---------------------------
// ユーティリティ
// ---------------------------
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

