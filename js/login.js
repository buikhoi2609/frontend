
// Nếu đã đăng nhập rồi thì khỏi cần xem lại trang này
if (getToken()) {
    window.location.href = "index.html";
}

const tabs = document.querySelectorAll(".auth-tab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        authMessage.textContent = "";
        authMessage.className = "auth-message";

        const isLogin = tab.dataset.tab === "login";
        loginForm.style.display = isLogin ? "block" : "none";
        registerForm.style.display = isLogin ? "none" : "block";
    });
});

function showMessage(text, isError = true) {
    authMessage.textContent = text;
    authMessage.className = "auth-message " + (isError ? "auth-error" : "auth-success");
}

function switchToLoginTab() {
    document.querySelector('.auth-tab[data-tab="login"]').click();
}

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const taiKhoan = document.getElementById("loginTaiKhoan").value.trim();
    const matKhau = document.getElementById("loginMatKhau").value;

    try {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taiKhoan, matKhau })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Đăng nhập thất bại");
        }

        saveSession(result.token, result.user);
        window.location.href = "index.html";

    } catch (error) {
        showMessage(error.message || "Không thể kết nối tới máy chủ");
    }
});

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const payload = {
        hoTen: document.getElementById("registerHoTen").value.trim(),
        dienThoai: document.getElementById("registerDienThoai").value.trim(),
        email: document.getElementById("registerEmail").value.trim(),
        taiKhoan: document.getElementById("registerTaiKhoan").value.trim(),
        matKhau: document.getElementById("registerMatKhau").value
    };

    try {
        const response = await fetch(`${AUTH_API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Đăng ký thất bại");
        }

        showMessage("Đăng ký thành công! Vui lòng đăng nhập.", false);
        registerForm.reset();
        switchToLoginTab();

    } catch (error) {
        showMessage(error.message || "Không thể kết nối tới máy chủ");
    }
});
