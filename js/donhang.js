
const API_URL = "http://localhost:8081/api/donhang";

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

// Lấy danh sách đơn hàng từ Backend
async function loadOrders() {
    const orderList = document.getElementById("orderList");
    const message = document.getElementById("message");

    orderList.innerHTML =
        '<tr><td colspan="7">Đang tải dữ liệu...</td></tr>';

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
            '<tr><td colspan="7">Không tải được dữ liệu</td></tr>';

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
            '<tr><td colspan="7">Chưa có đơn hàng nào</td></tr>';
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

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.className = "btn-delete";

        deleteButton.addEventListener("click", () => {
            deleteOrder(order.maDH);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        orderList.appendChild(row);
    });
}

// Mở form
function openForm() {
    document.getElementById("orderModal").style.display = "flex";
}

// Đóng form
function closeForm() {
    document.getElementById("orderModal").style.display = "none";
}

// Thêm đơn hàng
document.getElementById("orderForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const order = {
            maNV: Number(document.getElementById("maNV").value),
            tongTien: Number(document.getElementById("tongTien").value),
            phuongThucThanhToan: document.getElementById("phuongThucThanhToan").value.trim(),
            trangThai: document.getElementById("trangThai").value.trim() || "Hoàn thành"
        };

        try {
            const response = await authFetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(order)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể thêm đơn hàng");
            }

            alert("Thêm đơn hàng thành công!");

            this.reset();
            closeForm();

            await loadOrders();

        } catch (error) {
            alert("Lỗi thêm đơn hàng: " + error.message);
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
