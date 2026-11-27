document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".sidebar .nav-item");
    const views = document.querySelectorAll(".page-view");
    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    const pageInfo = {
        "view-products": {
            title: "Quản lý sản phẩm",
            subtitle: "Hệ thống quản lý bán hàng cửa hàng đồ gia dụng",
            onShow: () => typeof loadProducts === "function" && loadProducts()
        },
        "view-categories": {
            title: "Quản lý danh mục",
            subtitle: "Phân loại nhóm sản phẩm đồ gia dụng",
            onShow: () => typeof loadCategories === "function" && loadCategories()
        },
        "view-suppliers": {
            title: "Quản lý nhà cung cấp",
            subtitle: "Thông tin liên hệ và nguồn nhập hàng",
            onShow: () => typeof loadSuppliers === "function" && loadSuppliers()
        },
        "view-orders": {
            title: "Quản lý đơn hàng",
            subtitle: "Theo dõi đơn bán hàng, trạng thái và doanh thu",
            onShow: () => typeof loadOrders === "function" && loadOrders()
        }
    };

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetId = item.dataset.target;
            if (!targetId) return;

            // 1. Đổi trạng thái active trên sidebar
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            // 2. Ẩn hết các giao diện, chỉ hiện giao diện được chọn
            views.forEach(view => {
                view.style.display = "none";
                view.classList.remove("active");
            });

            const activeView = document.getElementById(targetId);
            if (activeView) {
                activeView.style.display = "block";
                activeView.classList.add("active");
            }

            // 3. Đổi tiêu đề & gọi hàm load dữ liệu của tab đó
            if (pageInfo[targetId]) {
                pageTitle.textContent = pageInfo[targetId].title;
                pageSubtitle.textContent = pageInfo[targetId].subtitle;
                pageInfo[targetId].onShow();
            }
        });
    });
});