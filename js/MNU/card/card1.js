// 固定パスワード設定
const passMap = {
    "pass1": "card1_1.html",
    "pass2": "card1_2.html",
    "pass3": "card1_3.html"
};

document.getElementById("passSubmit").addEventListener("click", () => {
    const input = document.getElementById("passInput").value;
    const msg = document.getElementById("passMessage");

    if (passMap[input]) {

        msg.style.color = "lime";
        msg.textContent = `「${passMap[input]}」に進みます… 3秒後に遷移します。`;

        let count = 3;
        const timer = setInterval(() => {
            count--;
            msg.textContent = `「${passMap[input]}」に進みます… ${count}秒`;

            if (count === 0) {
                clearInterval(timer);

                // 遷移
                window.location.href = passMap[input];
            }
        }, 1000);

    } else {
        msg.style.color = "red";
        msg.textContent = "パスワードが違います。";
    }
});
