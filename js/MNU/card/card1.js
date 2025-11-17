const passwords = {
    "pass1": "card1_1.html",
    "pass2": "card1_2.html",
    "pass3": "card1_3.html"
};

document.getElementById("submitPassword").addEventListener("click", () => {
    const input = document.getElementById("passwordInput").value;
    const msg = document.getElementById("passwordMessage");

    if(passwords[input]){
        const target = passwords[input];
        let count = 3;
        msg.textContent = `${target} に進みます。（${count}）`;
        const interval = setInterval(() => {
            count--;
            msg.textContent = `${target} に進みます。（${count}）`;
            if(count <= 0){
                clearInterval(interval);
                window.location.href = `./${target}`;
            }
        },1000);
    }else{
        msg.textContent = "パスワードが間違っています";
    }
});
