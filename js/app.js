
const API_URL = "http://localhost:8081/api/sanpham";

// Chưa đăng nhập thì đẩy về trang login ngay
requireAuth();

// Lưu mã sản phẩm đang sửa
let editingProductId = null;

// Hiển thị tên người dùng đang đăng nhập + xử lý đăng xuất
function initUserBox() {
    const user = getUser();
    const userName = document.getElementById("userName");

    if (user) {
        userName.textContent = `Xin chào, ${user.hoTen || user.taiKhoan}`;
    }

    document.getElementById("btnLogout").addEventListener("click", logout);
}

// Lấy danh sách sản phẩm từ Backend
async function loadProducts() {
    const productList = document.getElementById("productList");
    const message = document.getElementById("message");

    productList.innerHTML =
        '<tr><td colspan="9" class="empty-data">Đang tải dữ liệu...</td></tr>';

    message.textContent = "";

    try {
        const response = await authFetch(API_URL);

        if (!response.ok) {
            throw new Error("Không thể lấy dữ liệu sản phẩm");
        }

        const products = await response.json();

        displayProducts(products);

    } catch (error) {
        productList.innerHTML =
            '<tr><td colspan="9" class="empty-data">Không tải được dữ liệu</td></tr>';

        message.textContent =
            "Lỗi kết nối Backend: " + error.message;
    }
}

// Hiển thị sản phẩm lên bảng
function displayProducts(products) {
    const productList = document.getElementById("productList");

    if (products.length === 0) {
        productList.innerHTML =
            '<tr><td colspan="9" class="empty-data">Chưa có sản phẩm nào</td></tr>';
        return;
    }

    productList.innerHTML = "";

    products.forEach(product => {
        const row = document.createElement("tr");

        const values = [
            product.maSP,
            product.tenSP,
            product.maDM,
            product.donViTinh ?? "",
            formatMoney(product.giaNhap),
            formatMoney(product.giaBan),
            product.soLuongTon,
            product.trangThai ? "Đang bán" : "Ngừng bán"
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 7) {
                cell.className = product.trangThai
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
            editProduct(product.maSP);
        });

        // Nút Xóa
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.className = "btn-delete";

        deleteButton.addEventListener("click", () => {
            deleteProduct(product.maSP);
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);

        productList.appendChild(row);
    });
}

// Định dạng tiền
function formatMoney(value) {
    return Number(value).toLocaleString("vi-VN") + " đ";
}

// Mở form
function openForm() {
    document.getElementById("productModal").style.display = "flex";
}

function openAddForm() {

    editingProductId = null;

    document.getElementById("productForm").reset();

    const modalTitle = document.querySelector("#productModal h2");

    if (modalTitle) {
        modalTitle.textContent = "THÊM SẢN PHẨM";
    }

    const submitButton = document.querySelector(
        '#productForm button[type="submit"]'
    );

    if (submitButton) {
        submitButton.textContent = "Thêm sản phẩm";
    }

    openForm();
}

// Đóng form
function closeForm() {
    document.getElementById("productModal").style.display = "none";
}

// ======================================
// SỬA SẢN PHẨM
// ======================================

async function editProduct(id) {

    try {
        // Lấy thông tin sản phẩm theo ID
        const response = await authFetch(`${API_URL}/${id}`);

        if (!response.ok) {
            throw new Error("Không lấy được thông tin sản phẩm");
        }

        const product = await response.json();

        // Chuyển sang chế độ sửa
        editingProductId = id;

        // Đưa dữ liệu cũ vào form
        document.getElementById("tenSP").value = product.tenSP ?? "";
        document.getElementById("maDM").value = product.maDM ?? "";
        document.getElementById("maNCC").value = product.maNCC ?? "";
        document.getElementById("donViTinh").value = product.donViTinh ?? "";
        document.getElementById("giaNhap").value = product.giaNhap ?? "";
        document.getElementById("giaBan").value = product.giaBan ?? "";
        document.getElementById("soLuongTon").value = product.soLuongTon ?? "";

        document.getElementById("soLuongCanhBao").value =
            product.soLuongCanhBao ?? "";

        document.getElementById("hinhAnh").value = product.hinhAnh ?? "";
        document.getElementById("moTa").value = product.moTa ?? "";

        // Giữ trạng thái hiện tại của sản phẩm
        const trangThaiInput = document.getElementById("trangThai");

        if (trangThaiInput) {
            trangThaiInput.value = String(product.trangThai ?? true);
        }

        // Đổi tiêu đề form
        const modalTitle = document.querySelector("#productModal h2");

        if (modalTitle) {
            modalTitle.textContent = "SỬA THÔNG TIN SẢN PHẨM";
        }

        // Đổi tên nút submit
        const submitButton = document.querySelector(
            '#productForm button[type="submit"]'
        );

        if (submitButton) {
            submitButton.textContent = "Lưu thay đổi";
        }

        // Mở form
        openForm();

    } catch (error) {
        alert("Lỗi lấy thông tin sản phẩm: " + error.message);
        console.error(error);
    }
}

// Thêm sản phẩm
// ======================================
// THÊM VÀ CẬP NHẬT SẢN PHẨM
// ======================================

document.getElementById("productForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const product = {
            tenSP: document.getElementById("tenSP").value.trim(),

            maDM: Number(document.getElementById("maDM").value),

            maNCC: document.getElementById("maNCC").value
                ? Number(document.getElementById("maNCC").value)
                : null,

            donViTinh: document.getElementById("donViTinh").value.trim(),

            giaNhap: Number(document.getElementById("giaNhap").value),

            giaBan: Number(document.getElementById("giaBan").value),

            soLuongTon: Number(document.getElementById("soLuongTon").value),

            soLuongCanhBao: document.getElementById("soLuongCanhBao").value
                ? Number(document.getElementById("soLuongCanhBao").value)
                : null,

            hinhAnh: document.getElementById("hinhAnh").value.trim(),

            moTa: document.getElementById("moTa").value.trim(),

            trangThai: document.getElementById("trangThai")
                ? document.getElementById("trangThai").value === "true"
                : true
        };

        // Kiểm tra dữ liệu
        if (!product.tenSP || !product.maDM) {
            alert("Vui lòng nhập tên sản phẩm và mã danh mục!");
            return;
        }

        if (
            !Number.isFinite(product.giaNhap) ||
            !Number.isFinite(product.giaBan) ||
            product.giaNhap < 0 ||
            product.giaBan < 0
        ) {
            alert("Giá sản phẩm không hợp lệ!");
            return;
        }

        if (
            !Number.isInteger(product.soLuongTon) ||
            product.soLuongTon < 0
        ) {
            alert("Số lượng tồn phải là số nguyên không âm!");
            return;
        }

        const isEditing = editingProductId !== null;

        // Xác định API và phương thức
        const url = isEditing
            ? `${API_URL}/${editingProductId}`
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

                body: JSON.stringify(product)
            });

            if (!response.ok) {
                const errorText = await response.text();

                throw new Error(
                    errorText || "Không thể lưu sản phẩm"
                );
            }

            const result = await response.json();

            if (isEditing) {
                alert("Cập nhật sản phẩm thành công!");
            } else {
                alert("Thêm sản phẩm thành công!");
            }

            // Reset trạng thái form
            editingProductId = null;

            this.reset();

            closeForm();

            // Tải lại danh sách
            await loadProducts();

        } catch (error) {
            alert(
                (isEditing ? "Lỗi cập nhật: " : "Lỗi thêm: ")
                + error.message
            );

            console.error(error);

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Thêm sản phẩm";
            }
        }
    });

// Xóa sản phẩm
async function deleteProduct(id) {
    const confirmDelete = confirm(
        "Bạn có chắc chắn muốn xóa sản phẩm mã " + id + "?"
    );

    if (!confirmDelete) return;

    try {
        const response = await authFetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Không thể xóa sản phẩm");
        }

        alert("Xóa sản phẩm thành công!");

        await loadProducts();

    } catch (error) {
        alert("Lỗi xóa sản phẩm: " + error.message);
    }
}

// Tìm kiếm sản phẩm
document.getElementById("searchInput")
    .addEventListener("input", async function() {

        const keyword = this.value.toLowerCase().trim();

        try {
            const response = await authFetch(API_URL);

            if (!response.ok) {
                throw new Error("Không thể tìm kiếm sản phẩm");
            }

            const products = await response.json();

            const filteredProducts = products.filter(product =>
                String(product.maSP).includes(keyword) ||
                product.tenSP.toLowerCase().includes(keyword)
            );

            displayProducts(filteredProducts);

        } catch (error) {
            document.getElementById("message").textContent =
                error.message;
        }
    });

// Tự động tải danh sách khi mở trang
document.addEventListener("DOMContentLoaded", function () {
    initUserBox();
    loadProducts();
});
