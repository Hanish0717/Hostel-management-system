// sidebar.js
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".sidebar .menu a");

    // 1. URL Matching (Multi-page routing)
    const currentPage = window.location.pathname.split("/").pop();

    links.forEach(link => {
        const href = link.getAttribute("href");
        if (href && href === currentPage) {
            links.forEach(a => a.classList.remove("active"));
            link.classList.add("active");
        }
    });

    // 2. Click Handling (Single Page App routing)
    links.forEach(link => {
        link.addEventListener("click", function() {
            // Force remove active class from ALL links immediately
            links.forEach(a => a.classList.remove("active"));
            // Add active class ONLY to the clicked link
            this.classList.add("active");
        });
    });
});
