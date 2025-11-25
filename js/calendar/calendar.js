// calendar.js
// - イベントは localStorage の 'calendarEvents' に配列で保存 (各イベントに id を付与)
// - 各 .day セルには data-date="YYYY-MM-DD" を付与 -> 比較はこれで正確に行う
// - 重なったイベントは登録順で縦にスタッキング（上:古い, 下:新しい）
// - カテゴリ色は CATEGORY_COLORS で定義

const CATEGORY_COLORS = {
    "遊び": "bar-play",
    "仕事": "bar-work",
    "誕生日": "bar-bday",
    "プライベート": "bar-private",
    "その他": "bar-other"
};

let currentYear, currentMonth;
let selectedEventId = null;
let editMode = false; // 編集モード中か

// helper
function loadEvents() {
    try {
        return JSON.parse(localStorage.getItem("calendarEvents") || "[]");
    } catch (e) {
        return [];
    }
}
function saveEvents(arr) {
    localStorage.setItem("calendarEvents", JSON.stringify(arr));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

// 初期化
window.addEventListener("load", () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();

    document.getElementById("prevMonthBtn").onclick = prevMonth;
    document.getElementById("nextMonthBtn").onclick = nextMonth;

    document.getElementById("saveBtn").onclick = onSave;
    document.getElementById("editBtn").onclick = onEdit;
    document.getElementById("deleteBtn").onclick = onDelete;
    document.getElementById("closeBtn").onclick = () => { hideMemoArea(); };

    document.getElementById("eventSelect").onchange = onEventSelectChange;

    renderCalendar(currentYear, currentMonth);
});

// カレンダー描画
function renderCalendar(year, month) {
    const cal = document.getElementById("calendar");
    cal.innerHTML = "";

    // 年月
    document.getElementById("currentMonth").textContent = `${year}年${String(month+1).padStart(2,"0")}月`;

    // 曜日ヘッダー
    const weekdays = ["日","月","火","水","木","金","土"];
    weekdays.forEach((w,i) => {
        const d = document.createElement("div");
        d.className = "weekday";
        d.textContent = w;
        if (i===0) d.style.color = "red";
        if (i===6) d.style.color = "blue";
        cal.appendChild(d);
    });

    // 月情報
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay(); // 0=日
    const lastDate = new Date(year, month+1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    let day = 1;
    let nextDay = 1;

    // 6行 x 7列 = 42セル
    for (let i=0;i<42;i++) {
        const cell = document.createElement("div");
        cell.className = "day";

        // 前月
        if (i < startWeekday) {
            const dnum = prevLastDate - (startWeekday - 1 - i);
            const numEl = document.createElement("div");
            numEl.className = "day-number";
            numEl.textContent = dnum;
            cell.appendChild(numEl);

            // data-date for prev month
            let prevMonth = month - 1;
            let prevYear = year;
            if (prevMonth < 0) { prevMonth = 11; prevYear--; }
            cell.setAttribute("data-date", `${prevYear}-${String(prevMonth+1).padStart(2,"0")}-${String(dnum).padStart(2,"0")}`);
            cell.classList.add("disabled-day");
        }
        // 今月
        else if (day <= lastDate) {
            const numEl = document.createElement("div");
            numEl.className = "day-number";
            numEl.textContent = day;
            cell.appendChild(numEl);

            const weekday = i % 7;
            if (weekday === 0) cell.classList.add("sunday");
            if (weekday === 6) cell.classList.add("saturday");

            const dd = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            cell.setAttribute("data-date", dd);

            // クリックでメモ欄開く（その日を含むイベントがあれば一覧表示）
            cell.addEventListener("click", () => onDateClick(dd));

            day++;
        }
        // 翌月
        else {
            const numEl = document.createElement("div");
            numEl.className = "day-number";
            numEl.textContent = nextDay;
            cell.appendChild(numEl);

            let nextMonth = month + 1;
            let nextYear = year;
            if (nextMonth > 11) { nextMonth = 0; nextYear++; }
            cell.setAttribute("data-date", `${nextYear}-${String(nextMonth+1).padStart(2,"0")}-${String(nextDay).padStart(2,"0")}`);
            cell.classList.add("disabled-day");
            nextDay++;
        }

        cal.appendChild(cell);
    }

    // 描画後イベント帯を追加
    renderBars();
}

// 月移動
function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar(currentYear, currentMonth);
}
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar(currentYear, currentMonth);
}

// 日クリック
function onDateClick(dateStr) {
    // show memo area
    showMemoArea();

    // find events that cover this date (across all events)
    const events = loadEvents();
    const cellDate = new Date(dateStr);
    cellDate.setHours(12,0,0,0);

    const matches = events
        .map((ev, idx) => ({ ev, idx }))
        .filter(o => {
            const from = new Date(o.ev.from); from.setHours(0,0,0,0);
            const to   = new Date(o.ev.to);   to.setHours(23,59,59,999);
            return cellDate.getTime() >= from.getTime() && cellDate.getTime() <= to.getTime();
        });

    const selectorWrap = document.getElementById("eventSelectorWrap");
    const eventSelect = document.getElementById("eventSelect");

    if (matches.length === 0) {
        // 新規入力モード
        selectorWrap.style.display = "none";
        selectedEventId = null;
        editMode = false;
        setMemoFieldsEnabled(true);
        document.getElementById("dateFrom").value = dateStr;
        document.getElementById("dateTo").value = dateStr;
        document.getElementById("category").value = "遊び";
        document.getElementById("memoText").value = "";
        document.getElementById("saveBtn").disabled = false;
        document.getElementById("editBtn").disabled = true;
        document.getElementById("deleteBtn").disabled = true;
    } else {
        // 表示モード：イベント一覧をselectに入れて最初のを表示
        selectorWrap.style.display = "block";
        eventSelect.innerHTML = "";
        matches.forEach((m, i) => {
            const opt = document.createElement("option");
            opt.value = m.ev.id;
            opt.textContent = `${m.ev.category} ${m.ev.from}→${m.ev.to}`;
            eventSelect.appendChild(opt);
        });

        // load first
        eventSelect.selectedIndex = 0;
        loadEventById(eventSelect.value);
        // ensure fields are readonly until edit pressed
        setMemoFieldsEnabled(false);
        document.getElementById("saveBtn").disabled = true;
        document.getElementById("editBtn").disabled = false;
        document.getElementById("deleteBtn").disabled = false;
    }
}

// show/hide memo area
function showMemoArea() {
    document.getElementById("memoArea").style.display = "block";
}
function hideMemoArea() {
    document.getElementById("memoArea").style.display = "none";
    // reset selector wrap
    document.getElementById("eventSelectorWrap").style.display = "none";
    selectedEventId = null;
    editMode = false;
}

// enable/disable inputs (when viewing vs editing)
function setMemoFieldsEnabled(enabled) {
    document.getElementById("dateFrom").disabled = !enabled;
    document.getElementById("dateTo").disabled = !enabled;
    document.getElementById("category").disabled = !enabled;
    document.getElementById("memoText").disabled = !enabled;
}

// eventSelect change
function onEventSelectChange(e) {
    const id = e.target.value;
    loadEventById(id);
}

// load event into form by id
function loadEventById(id) {
    const events = loadEvents();
    const ev = events.find(x => x.id === id);
    if (!ev) return;
    selectedEventId = id;
    document.getElementById("dateFrom").value = ev.from;
    document.getElementById("dateTo").value = ev.to;
    document.getElementById("category").value = ev.category;
    document.getElementById("memoText").value = ev.memo || "";
    // read-only until edit pressed
    setMemoFieldsEnabled(false);
    editMode = false;
    document.getElementById("saveBtn").disabled = true;
    document.getElementById("editBtn").disabled = false;
    document.getElementById("deleteBtn").disabled = false;
}

// 保存（新規 or 上書き）
function onSave() {
    const from = document.getElementById("dateFrom").value;
    const to   = document.getElementById("dateTo").value;
    const category = document.getElementById("category").value;
    const memo = document.getElementById("memoText").value;

    if (!from || !to) { alert("期間を指定してください。"); return; }
    const dFrom = new Date(from); dFrom.setHours(0,0,0,0);
    const dTo   = new Date(to);   dTo.setHours(23,59,59,999);
    if (dFrom.getTime() > dTo.getTime()) { alert("開始日は終了日より前にしてください。"); return; }

    let events = loadEvents();

    if (selectedEventId && editMode) {
        // 上書き：find by id
        const idx = events.findIndex(e => e.id === selectedEventId);
        if (idx !== -1) {
            events[idx].from = from;
            events[idx].to = to;
            events[idx].category = category;
            events[idx].memo = memo;
            // keep id
        } else {
            alert("編集対象が見つかりません。");
            return;
        }
    } else {
        // 新規追加（idを付与）
        const ev = { id: uid(), from, to, category, memo, createdAt: Date.now() };
        events.push(ev);
        // 選択状態にする（新しいイベントを選べるように）
        selectedEventId = ev.id;
    }

    saveEvents(events);
    editMode = false;

    // 保存後は閲覧モード（読み取り専用）にする
    setMemoFieldsEnabled(false);
    document.getElementById("saveBtn").disabled = true;
    document.getElementById("editBtn").disabled = false;
    document.getElementById("deleteBtn").disabled = false;

    renderCalendar(currentYear, currentMonth);
}

// 編集ボタン
function onEdit() {
    if (!selectedEventId) {
        // 新規入力時はここが disabled になっているはず
        alert("編集対象がありません。");
        return;
    }
    if (!confirm("編集を開始しますか？")) return;
    editMode = true;
    // enable fields
    setMemoFieldsEnabled(true);
    document.getElementById("saveBtn").disabled = false;
    document.getElementById("editBtn").disabled = true;
}

// 削除
function onDelete() {
    if (!selectedEventId) {
        alert("削除対象がありません。");
        return;
    }
    if (!confirm("この予定を削除しますか？")) return;
    let events = loadEvents();
    events = events.filter(e => e.id !== selectedEventId);
    saveEvents(events);
    selectedEventId = null;
    hideMemoArea();
    renderCalendar(currentYear, currentMonth);
}

// 描画：横棒（各セルごとにその日を含むイベントを走査して bar-strip を積む）
function renderBars() {
    const events = loadEvents(); // 配列（登録順に保持）

    // まず既存の bar-strip を消す（全セル）
    const cells = Array.from(document.querySelectorAll("#calendar .day"));
    cells.forEach(cell => {
        // remove previous strips
        const strips = Array.from(cell.querySelectorAll(".bar-strip"));
        strips.forEach(s => s.remove());
    });

    if (!events || events.length === 0) return;

    // For each cell, we will iterate events in original order and add strips for events that include that date.
    cells.forEach(cell => {
        const dateStr = cell.getAttribute("data-date");
        if (!dateStr) return;
        const cDate = new Date(dateStr); cDate.setHours(12,0,0,0);

        // counter to compute vertical offset (number of earlier events covering this date)
        let overlapCount = 0;

        // iterate events in stored order -> older first
        events.forEach((ev, evIndex) => {
            const from = new Date(ev.from); from.setHours(0,0,0,0);
            const to   = new Date(ev.to);   to.setHours(23,59,59,999);

            if (cDate.getTime() >= from.getTime() && cDate.getTime() <= to.getTime()) {
                // this event covers the cell date -> create a strip
                const strip = document.createElement("div");
                strip.className = "bar-strip";

                // add category color class
                const cls = CATEGORY_COLORS[ev.category] || "bar-other";
                strip.classList.add(cls);

                // vertical position: base 6px + overlapCount * (height+4)
                const top = 6 + overlapCount * 22; // 18px height + 4px gap
                strip.style.top = top + "px";

                // label only if this cell is the start date of the event
                const fromNorm = new Date(ev.from); fromNorm.setHours(0,0,0,0);
                if (cDate.getFullYear() === fromNorm.getFullYear() &&
                    cDate.getMonth() === fromNorm.getMonth() &&
                    cDate.getDate() === fromNorm.getDate()) {

                    const lbl = document.createElement("div");
                    lbl.className = "label";
                    lbl.textContent = ev.category;
                    strip.appendChild(lbl);

                    // clicking on the label should load this event for editing/view
                    lbl.style.cursor = "pointer";
                    lbl.addEventListener("click", (e) => {
                        // prevent cell click bubbling
                        e.stopPropagation();
                        selectedEventId = ev.id;
                        // populate selector and fields
                        document.getElementById("eventSelectorWrap").style.display = "block";
                        const sel = document.getElementById("eventSelect");
                        sel.innerHTML = "";
                        const opt = document.createElement("option");
                        opt.value = ev.id;
                        opt.textContent = `${ev.category} ${ev.from}→${ev.to}`;
                        sel.appendChild(opt);
                        sel.selectedIndex = 0;
                        loadEventById(ev.id);
                    });
                }

                // clicking a strip will also load the event
                strip.addEventListener("click", (e) => {
                    e.stopPropagation();
                    selectedEventId = ev.id;
                    loadEventById(ev.id);
                    showMemoArea();
                });

                cell.appendChild(strip);

                overlapCount++; // next overlapping event shifts down
            }
        });

        // if many overlaps push cell min-height to accommodate
        if (overlapCount > 0) {
            const needed = 6 + overlapCount * 22 + 6; // top + stacks + bottom margin
            cell.style.minHeight = Math.max(72, needed + 28) + "px";
        } else {
            cell.style.minHeight = "";
        }
    });
}
