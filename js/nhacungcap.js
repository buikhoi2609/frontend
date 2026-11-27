
const API_URL = "http://localhost:8081/api/nhacungcap";

// Chưa đăng nhập thì đẩy về trang login ngay
requireAuth();

// Lưu mã nhà cung cấp đang sửa
let editingSupplierId = null;

// Hiển thị tên người dùng đang đăng nhập + xử lý đăng xuất
function initUserBox() {
    const user = getUser();
    const userName = document.getElementById("userName");

    if (user) {
        userName.textContent = `Xin chào, ${user.hoTen || user.taiKhoan}`;
    }

    document.getElementById("btnLogout").addEventListener("click", logout);
}

// Lấy danh sách nhà cung cấp từ Backend
async function loadSuppliers() {
    const supplierList = document.getElementById("supplierList");
    const message = document.getElementById("message");

    supplierList.innerHTML =
        '<tr><td colspan="7" class="empty-data">Đang tải dữ liệu...</td></tr>';

    message.textContent = "";

    try {
        const response = await authFetch(API_URL);

        if (!response.ok) {
            throw new Error("Không thể lấy dữ liệu nhà cung cấp");
        }

        const suppliers = await response.json();

        displaySuppliers(suppliers);

    } catch (error) {
        supplierList.innerHTML =
            '<tr><td colspan="7" class="empty-data">Không tải được dữ liệu</td></tr>';

        message.textContent =
            "Lỗi kết nối Backend: " + error.message;
    }
}

// Hiển thị nhà cung cấp lên bảng
function displaySuppliers(suppliers) {
    const supplierList = document.getElementById("supplierList");

    if (suppliers.length === 0) {
        supplierList.innerHTML =
            '<tr><td colspan="7" class="empty-data">Chưa có nhà cung cấp nào</td></tr>';
        return;
    }

    supplierList.innerHTML = "";

    suppliers.forEach(supplier => {
        const row = document.createElement("tr");

        const values = [
            supplier.maNCC,
            supplier.tenNCC,
            supplier.dienThoai ?? "",
            supplier.email ?? "",
            supplier.diaChi ?? "",
            supplier.trangThai ? "Đang hoạt động" : "Ngừng hợp tác"
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 5) {
                cell.className = supplier.trangThai
                    ? "status-active"
                    : "status-inactive";
            }

            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");

        // Nút Sửa
        const editButton = document.createElement("button");
        editButton.textContent = "Sửa";
        editButton.className = "btn-edit";

        editButton.addEventListener("click", () => {
            editSupplier(supplier.maNCC);
        });

        // Nút Xóa
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.className = "btn-delete";

        deleteButton.addEventListener("click", () => {
            deleteSupplier(supplier.maNCC);
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        supplierList.appendChild(row);
    });
}

// Mở form
function openForm() {
    document.getElementById("supplierModal").style.display = "flex";
}

function openAddForm() {

    editingSupplierId = null;

    document.getElementById("supplierForm").reset();

    const modalTitle = document.querySelector("#supplierModal h2");

    if (modalTitle) {
        modalTitle.textContent = "THÊM NHÀ CUNG CẤP";
    }

    const submitButton = document.querySelector(
        '#supplierForm button[type="submit"]'
    );

    if (submitButton) {
        submitButton.textContent = "Lưu nhà cung cấp";
    }

    openForm();
}

// Đóng form
function closeForm() {
    document.getElementById("supplierModal").style.display = "none";
}

// ======================================
// SỬA NHÀ CUNG CẤP
// ======================================

async function editSupplier(id) {

    try {
        const response = await authFetch(`${API_URL}/${id}`);

        if (!response.ok) {
            throw new Error("Không lấy được thông tin nhà cung cấp");
        }

        const supplier = await response.json();

        editingSupplierId = id;

        document.getElementById("tenNCC").value = supplier.tenNCC ?? "";
        document.getElementById("dienThoai").value = supplier.dienThoai ?? "";
        document.getElementById("email").value = supplier.email ?? "";
        document.getElementById("diaChi").value = supplier.diaChi ?? "";

        const trangThaiInput = document.getElementById("trangThai");

        if (trangThaiInput) {
            trangThaiInput.value = String(supplier.trangThai ?? true);
        }

        const modalTitle = document.querySelector("#supplierModal h2");

        if (modalTitle) {
            modalTitle.textContent = "SỬA NHÀ CUNG CẤP";
        }

        const submitButton = document.querySelector(
            '#supplierForm button[type="submit"]'
        );

        if (submitButton) {
            submitButton.textContent = "Lưu thay đổi";
        }

        openForm();

    } catch (error) {
        alert("Lỗi lấy thông tin nhà cung cấp: " + error.message);
        console.error(error);
    }
}

// ======================================
// THÊM VÀ CẬP NHẬT NHÀ CUNG CẤP
// ======================================

document.getElementById("supplierForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const supplier = {
            tenNCC: document.getElementById("tenNCC").value.trim(),
            dienThoai: document.getElementById("dienThoai").value.trim(),
            email: document.getElementById("email").value.trim(),
            diaChi: document.getElementById("diaChi").value.trim(),

            trangThai: document.getElementById("trangThai")
                ? document.getElementById("trangThai").value === "true"
                : true
        };

        if (!supplier.tenNCC) {
            alert("Vui lòng nhập tên nhà cung cấp!");
            return;
        }

        const isEditing = editingSupplierId !== null;

        const url = isEditing
            ? `${API_URL}/${editingSupplierId}`
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
                body: JSON.stringify(supplier)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    errorText || "Không thể lưu nhà cung cấp"
                );
            }

            if (isEditing) {
                alert("Cập nhật nhà cung cấp thành công!");
            } else {
                alert("Thêm nhà cung cấp thành công!");
            }

            editingSupplierId = null;

            this.reset();
            closeForm();

            await loadSuppliers();

        } catch (error) {
            alert(
                (isEditing ? "Lỗi cập nhật: " : "Lỗi thêm: ")
                + error.message
            );

            console.error(error);

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Lưu nhà cung cấp";
            }
        }
    });

// Xóa nhà cung cấp
async function deleteSupplier(id) {
    const confirmDelete = confirm(
        "Bạn có chắc chắn muốn xóa nhà cung cấp mã " + id + "?"
    );

    if (!confirmDelete) return;

    try {
        const response = await authFetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Không thể xóa nhà cung cấp");
        }

        alert("Xóa nhà cung cấp thành công!");

        await loadSuppliers();

    } catch (error) {
        alert("Lỗi xóa nhà cung cấp: " + error.message);
    }
}

// Tìm kiếm nhà cung cấp
document.getElementById("searchInput")
    .addEventListener("input", async function() {

        const keyword = this.value.toLowerCase().trim();

        try {
            const response = await authFetch(API_URL);

            if (!response.ok) {
                throw new Error("Không thể tìm kiếm nhà cung cấp");
            }

            const suppliers = await response.json();

            const filteredSuppliers = suppliers.filter(supplier =>
                String(supplier.maNCC).includes(keyword) ||
                supplier.tenNCC.toLowerCase().includes(keyword)
            );

            displaySuppliers(filteredSuppliers);

        } catch (error) {
            document.getElementById("message").textContent =
                error.message;
        }
    });

// Tự động tải danh sách khi mở trang
document.addEventListener("DOMContentLoaded", function () {
    initUserBox();
    loadSuppliers();
});
