
const API_URL = "http://localhost:8081/api/donhang";

// Chưa đăng nhập thì đẩy về trang login ngay
requireAuth();

// Lưu mã đơn hàng đang sửa
let editingOrderId = null;

// Hiển thị tên người dùng đang đăng nhập + xử lý đăng xuất
function initUserBox() {
    const user = getUser();
    const userName = document.getElementById("userName");

    if (user) {
        userName.textContent = `Xin chào, ${user.hoTen || user.taiKhoan}`;
    }

    document.getElementById("btnLogout").addEventListener("click", logout);
}

// Lấy danh sách đơn hàng từ Backend
async function loadOrders() {
    const orderList = document.getElementById("orderList");
    const message = document.getElementById("message");

    orderList.innerHTML =
        '<tr><td colspan="7" class="empty-data">Đang tải dữ liệu...</td></tr>';

    message.textContent = "";

    try {
        const response = await authFetch(API_URL);

        if (!response.ok) {
            throw new Error("Không thể lấy dữ liệu đơn hàng");
        }

        const orders = await response.json();

        displayOrders(orders);

    } catch (error) {
        orderList.innerHTML =
            '<tr><td colspan="7" class="empty-data">Không tải được dữ liệu</td></tr>';

        message.textContent =
            "Lỗi kết nối Backend: " + error.message;
    }
}

// Định dạng tiền
function formatMoney(value) {
    return Number(value).toLocaleString("vi-VN") + " đ";
}

// Định dạng ngày giờ
function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleString("vi-VN");
}

// Hiển thị đơn hàng lên bảng
function displayOrders(orders) {
    const orderList = document.getElementById("orderList");

    if (orders.length === 0) {
        orderList.innerHTML =
            '<tr><td colspan="7" class="empty-data">Chưa có đơn hàng nào</td></tr>';
        return;
    }

    orderList.innerHTML = "";

    orders.forEach(order => {
        const row = document.createElement("tr");

        const values = [
            order.maDH,
            order.maNV ?? "",
            formatDate(order.ngayDat),
            formatMoney(order.tongTien ?? 0),
            order.phuongThucThanhToan ?? "",
            order.trangThai ?? ""
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
            editOrder(order.maDH);
        });

        // Nút Xóa
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.className = "btn-delete";

        deleteButton.addEventListener("click", () => {
            deleteOrder(order.maDH);
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        orderList.appendChild(row);
    });
}

// Mở form
function openForm() {
    document.getElementById("orderModal").style.display = "flex";
}

function openAddForm() {

    editingOrderId = null;

    document.getElementById("orderForm").reset();

    const modalTitle = document.querySelector("#orderModal h2");

    if (modalTitle) {
        modalTitle.textContent = "THÊM ĐƠN HÀNG";
    }

    const submitButton = document.querySelector(
        '#orderForm button[type="submit"]'
    );

    if (submitButton) {
        submitButton.textContent = "Lưu đơn hàng";
    }

    openForm();
}

// Đóng form
function closeForm() {
    document.getElementById("orderModal").style.display = "none";
}

// ======================================
// SỬA ĐƠN HÀNG
// ======================================

async function editOrder(id) {

    try {
        const response = await authFetch(`${API_URL}/${id}`);

        if (!response.ok) {
            throw new Error("Không lấy được thông tin đơn hàng");
        }

        const order = await response.json();

        editingOrderId = id;

        document.getElementById("maNV").value = order.maNV ?? "";
        document.getElementById("tongTien").value = order.tongTien ?? "";

        document.getElementById("phuongThucThanhToan").value =
            order.phuongThucThanhToan ?? "";

        const trangThaiInput = document.getElementById("trangThai");

        if (trangThaiInput) {
            trangThaiInput.value = order.trangThai ?? "Hoàn thành";
        }

        const modalTitle = document.querySelector("#orderModal h2");

        if (modalTitle) {
            modalTitle.textContent = "SỬA ĐƠN HÀNG";
        }

        const submitButton = document.querySelector(
            '#orderForm button[type="submit"]'
        );

        if (submitButton) {
            submitButton.textContent = "Lưu thay đổi";
        }

        openForm();

    } catch (error) {
        alert("Lỗi lấy thông tin đơn hàng: " + error.message);
        console.error(error);
    }
}

// ======================================
// THÊM VÀ CẬP NHẬT ĐƠN HÀNG
// ======================================

document.getElementById("orderForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const order = {
            maNV: Number(document.getElementById("maNV").value),
            tongTien: Number(document.getElementById("tongTien").value),
            phuongThucThanhToan: document.getElementById("phuongThucThanhToan").value.trim(),
            trangThai: document.getElementById("trangThai").value.trim() || "Hoàn thành"
        };

        if (
            !Number.isInteger(order.maNV) ||
            order.maNV <= 0 ||
            !Number.isFinite(order.tongTien) ||
            order.tongTien < 0
        ) {
            alert("Vui lòng nhập mã nhân viên và tổng tiền hợp lệ!");
            return;
        }

        const isEditing = editingOrderId !== null;

        const url = isEditing
            ? `${API_URL}/${editingOrderId}`
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
                body: JSON.stringify(order)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể lưu đơn hàng");
            }

            if (isEditing) {
                alert("Cập nhật đơn hàng thành công!");
            } else {
                alert("Thêm đơn hàng thành công!");
            }

            editingOrderId = null;

            this.reset();
            closeForm();

            await loadOrders();

        } catch (error) {
            alert(
                (isEditing ? "Lỗi cập nhật: " : "Lỗi thêm: ")
                + error.message
            );

            console.error(error);

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Lưu đơn hàng";
            }
        }
    });

// Xóa đơn hàng
async function deleteOrder(id) {
    const confirmDelete = confirm(
        "Bạn có chắc chắn muốn xóa đơn hàng mã " + id + "?"
    );

    if (!confirmDelete) return;

    try {
        const response = await authFetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Không thể xóa đơn hàng");
        }

        alert("Xóa đơn hàng thành công!");

        await loadOrders();

    } catch (error) {
        alert("Lỗi xóa đơn hàng: " + error.message);
    }
}

// Tìm kiếm đơn hàng
document.getElementById("searchInput")
    .addEventListener("input", async function() {

        const keyword = this.value.toLowerCase().trim();

        try {
            const response = await authFetch(API_URL);

            if (!response.ok) {
                throw new Error("Không thể tìm kiếm đơn hàng");
            }

            const orders = await response.json();

            const filteredOrders = orders.filter(order =>
                String(order.maDH).includes(keyword) ||
                String(order.maNV ?? "").includes(keyword)
            );

            displayOrders(filteredOrders);

        } catch (error) {
            document.getElementById("message").textContent =
                error.message;
        }
    });

// Tự động tải danh sách khi mở trang
document.addEventListener("DOMContentLoaded", function () {
    initUserBox();
    loadOrders();
});
