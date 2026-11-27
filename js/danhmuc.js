
const API_URL = "http://localhost:8081/api/danhmuc";

// Chưa đăng nhập thì đẩy về trang login ngay
requireAuth();

// Lưu mã danh mục đang sửa
let editingCategoryId = null;

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
        '<tr><td colspan="4" class="empty-data">Đang tải dữ liệu...</td></tr>';

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
            '<tr><td colspan="4" class="empty-data">Không tải được dữ liệu</td></tr>';

        message.textContent =
            "Lỗi kết nối Backend: " + error.message;
    }
}

// Hiển thị danh mục lên bảng
function displayCategories(categories) {
    const categoryList = document.getElementById("categoryList");

    if (categories.length === 0) {
        categoryList.innerHTML =
            '<tr><td colspan="4" class="empty-data">Chưa có danh mục nào</td></tr>';
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

        // Nút Sửa
        const editButton = document.createElement("button");
        editButton.textContent = "Sửa";
        editButton.className = "btn-edit";

        editButton.addEventListener("click", () => {
            editCategory(category.maDM);
        });

        // Nút Xóa
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.className = "btn-delete";

        deleteButton.addEventListener("click", () => {
            deleteCategory(category.maDM);
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        categoryList.appendChild(row);
    });
}

// Mở form
function openForm() {
    document.getElementById("categoryModal").style.display = "flex";
}

function openAddForm() {

    editingCategoryId = null;

    document.getElementById("categoryForm").reset();

    const modalTitle = document.querySelector("#categoryModal h2");

    if (modalTitle) {
        modalTitle.textContent = "THÊM DANH MỤC";
    }

    const submitButton = document.querySelector(
        '#categoryForm button[type="submit"]'
    );

    if (submitButton) {
        submitButton.textContent = "Lưu danh mục";
    }

    openForm();
}

// Đóng form
function closeForm() {
    document.getElementById("categoryModal").style.display = "none";
}

// ======================================
// SỬA DANH MỤC
// ======================================

async function editCategory(id) {

    try {
        const response = await authFetch(`${API_URL}/${id}`);

        if (!response.ok) {
            throw new Error("Không lấy được thông tin danh mục");
        }

        const category = await response.json();

        editingCategoryId = id;

        document.getElementById("tenDM").value = category.tenDM ?? "";
        document.getElementById("moTa").value = category.moTa ?? "";

        const modalTitle = document.querySelector("#categoryModal h2");

        if (modalTitle) {
            modalTitle.textContent = "SỬA DANH MỤC";
        }

        const submitButton = document.querySelector(
            '#categoryForm button[type="submit"]'
        );

        if (submitButton) {
            submitButton.textContent = "Lưu thay đổi";
        }

        openForm();

    } catch (error) {
        alert("Lỗi lấy thông tin danh mục: " + error.message);
        console.error(error);
    }
}

// ======================================
// THÊM VÀ CẬP NHẬT DANH MỤC
// ======================================

document.getElementById("categoryForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const category = {
            tenDM: document.getElementById("tenDM").value.trim(),
            moTa: document.getElementById("moTa").value.trim()
        };

        if (!category.tenDM) {
            alert("Vui lòng nhập tên danh mục!");
            return;
        }

        const isEditing = editingCategoryId !== null;

        const url = isEditing
            ? `${API_URL}/${editingCategoryId}`
            : API_URL;

        const method = isEditing ? "PUT" : "POST";

        const submitButton = this.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Đang lưu...";
        }

        try {
            const response = await authFetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(category)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    errorText || "Không thể lưu danh mục"
                );
            }

            if (isEditing) {
                alert("Cập nhật danh mục thành công!");
            } else {
                alert("Thêm danh mục thành công!");
            }

            editingCategoryId = null;

            this.reset();
            closeForm();

            await loadCategories();

        } catch (error) {
            alert(
                (isEditing ? "Lỗi cập nhật: " : "Lỗi thêm: ")
                + error.message
            );

            console.error(error);

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Lưu danh mục";
            }
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
