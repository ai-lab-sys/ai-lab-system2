// // ------------------------------
// // ▼ カードをクリック → 任意画面へ遷移
// // ------------------------------
// function goPage(pageName) {
//     alert(pageName + " に移動する処理を実装してください！");
//     // 実際の遷移：
//     // window.location.href = "../../contents/page1.html";
// }

// // -------------------------------------------
// // ▼ 画面①クリック → card1.html をモーダルに表示
// // -------------------------------------------
// document.getElementById("card1Btn").addEventListener("click", () => {
//     const modal = document.getElementById("modal");
//     const modalContent = document.getElementById("modalContent");

//     fetch("./card/card1.html")
//         .then(res => res.text())
//         .then(html => {
//             modalContent.innerHTML = html;    // HTML反映
//             modal.style.display = "flex";     // モーダル表示

//             // card1.js を後から読み込み
//             const script = document.createElement("script");
//             script.src = "./card/card1.js";
//             modalContent.appendChild(script);
//         })
//         .catch(err => console.error("カード読み込みエラー:", err));
// });

// // -------------------------------------------
// // ▼ モーダル外をクリックで閉じる
// // -------------------------------------------
// window.addEventListener("click", (e) => {
//     const modal = document.getElementById("modal");
//     if (e.target === modal) modal.style.display = "none";
// });



// // モーダル閉じる
// document.getElementById("modalClose").addEventListener("click", () => {
//     document.getElementById("modal").style.display = "none";
// });


// // ------------------------------
// // ▼ ログアウトボタン
// // ------------------------------
// document.getElementById("logoutBtn").addEventListener("click", () => {
//     if (confirm("ログアウトしますか？")) {
//         window.location.href = "../LGN/lgn.html";
//     }
// });
