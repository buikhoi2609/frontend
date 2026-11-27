
const AUTH_API_URL = "http://localhost:8081/api/auth";
const TOKEN_KEY = "qlbh_token";
const USER_KEY = "qlbh_user";

// Lưu token + thông tin người dùng sau khi đăng nhập
function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function logout() {
    clearSession();
    window.location.href = "login.html";
}

// Gọi ở đầu các trang cần đăng nhập mới được xem
function requireAuth() {
    if (!getToken()) {
        window.location.href = "login.html";
    }
}

// fetch có đính kèm Authorization: Bearer <token>, tự đăng xuất nếu token hết hạn/không hợp lệ
async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = Object.assign({}, options.headers);

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const response = await fetch(url, Object.assign({}, options, { headers }));

    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
    }

    return response;
}
