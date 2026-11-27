
const API_URL = "http://localhost:8081/api/danhmuc";

// Chưa đăng nhập thì đẩy về trang login ngay
requireAuth();

// Hiển thị tên người dùng đang đăng nhập + xử lý đăng xuất
function initUserBox() {
    const user = getUser();
    const userName = document.getElementById("userName");

    if (user) {
        userName.textContent = `Xin chào, ${user.hoTen || user.taiKhoan}`;
    }

    document.getElementById("btnLogout").addEventListener("click", logout);
}

// Lấy danh sách danh mục từ Backend
async function loadCategories() {
    const categoryList = document.getElementById("categoryList");
    const message = document.getElementById("message");

    categoryList.innerHTML =
        '<tr><td colspan="4">Đang tải dữ liệu...</td></tr>';

    message.textContent = "";

    try {
        const response = await authFetch(API_URL);

        if (!response.ok) {
            throw new Error("Không thể lấy dữ liệu danh mục");
        }

        const categories = await response.json();

        displayCategories(categories);

    } catch (error) {
        categoryList.innerHTML =
            '<tr><td colspan="4">Không tải được dữ liệu</td></tr>';

        message.textContent =
            "Lỗi kết nối Backend: " + error.message;
    }
}

// Hiển thị danh mục lên bảng
function displayCategories(categories) {
    const categoryList = document.getElementById("categoryList");

    if (categories.length === 0) {
        categoryList.innerHTML =
            '<tr><td colspan="4">Chưa có danh mục nào</td></tr>';
        return;
    }

    categoryList.innerHTML = "";

    categories.forEach(category => {
        const row = document.createElement("tr");

        const values = [
            category.maDM,
            category.tenDM,
            category.moTa ?? ""
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.className = "btn-delete";

        deleteButton.addEventListener("click", () => {
            deleteCategory(category.maDM);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        categoryList.appendChild(row);
    });
}

// Mở form
function openForm() {
    document.getElementById("categoryModal").style.display = "flex";
}

// Đóng form
function closeForm() {
    document.getElementById("categoryModal").style.display = "none";
}

// Thêm danh mục
document.getElementById("categoryForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const category = {
            tenDM: document.getElementById("tenDM").value.trim(),
            moTa: document.getElementById("moTa").value.trim()
        };

        try {
            const response = await authFetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(category)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể thêm danh mục");
            }

            alert("Thêm danh mục thành công!");

            this.reset();
            closeForm();

            await loadCategories();

        } catch (error) {
            alert("Lỗi thêm danh mục: " + error.message);
        }
    });

// Xóa danh mục
async function deleteCategory(id) {
    const confirmDelete = confirm(
        "Bạn có chắc chắn muốn xóa danh mục mã " + id + "?"
    );

    if (!confirmDelete) return;

    try {
        const response = await authFetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Không thể xóa danh mục");
        }

        alert("Xóa danh mục thành công!");

        await loadCategories();

    } catch (error) {
        alert("Lỗi xóa danh mục: " + error.message);
    }
}

// Tìm kiếm danh mục
document.getElementById("searchInput")
    .addEventListener("input", async function() {

        const keyword = this.value.toLowerCase().trim();

        try {
            const response = await authFetch(API_URL);

            if (!response.ok) {
                throw new Error("Không thể tìm kiếm danh mục");
            }

            const categories = await response.json();

            const filteredCategories = categories.filter(category =>
                String(category.maDM).includes(keyword) ||
                category.tenDM.toLowerCase().includes(keyword)
            );

            displayCategories(filteredCategories);

        } catch (error) {
            document.getElementById("message").textContent =
                error.message;
        }
    });

// Tự động tải danh sách khi mở trang
document.addEventListener("DOMContentLoaded", function () {
    initUserBox();
    loadCategories();
});
