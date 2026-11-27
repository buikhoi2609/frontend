
const API_URL = "http://localhost:8081/api/sanpham";

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

// Lấy danh sách sản phẩm từ Backend
async function loadProducts() {
    const productList = document.getElementById("productList");
    const message = document.getElementById("message");

    productList.innerHTML =
        '<tr><td colspan="9">Đang tải dữ liệu...</td></tr>';

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
            '<tr><td colspan="9">Không tải được dữ liệu</td></tr>';

        message.textContent =
            "Lỗi kết nối Backend: " + error.message;
    }
}

// Hiển thị sản phẩm lên bảng
function displayProducts(products) {
    const productList = document.getElementById("productList");

    if (products.length === 0) {
        productList.innerHTML =
            '<tr><td colspan="9">Chưa có sản phẩm nào</td></tr>';
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

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.className = "btn-delete";

        deleteButton.addEventListener("click", () => {
            deleteProduct(product.maSP);
        });

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

// Đóng form
function closeForm() {
    document.getElementById("productModal").style.display = "none";
}

// Thêm sản phẩm
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
            trangThai: true
        };

        try {
            const response = await authFetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể thêm sản phẩm");
            }

            alert("Thêm sản phẩm thành công!");

            this.reset();
            closeForm();

            await loadProducts();

        } catch (error) {
            alert("Lỗi thêm sản phẩm: " + error.message);
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
