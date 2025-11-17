document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const errorMessage = document.getElementById("errorMessage");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const userId = document.getElementById("userId").value;
        const password = document.getElementById("password").value;

        // 仮のログイン：あとでAPIに切り替え可能
        if (userId === "admin" && password === "1234") {
            window.location.href = "../../contents/index.html";
        } else {
            errorMessage.textContent = "ユーザーIDまたはパスワードが違います";
        }
    });
});
