// DOM Elements
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");
const dropdowns = document.querySelectorAll(".dropdown");
const navLinks = document.querySelectorAll(".nav-link, .dropdown-link");

// Toggle Mobile Drawer
function toggleMobileMenu() {
    const isOpen = navMenu.classList.toggle("open");
    hamburgerBtn.classList.toggle("active", isOpen);
    hamburgerBtn.setAttribute("aria-expanded", String(isOpen));

    // Prevent background scrolling when mobile menu is open
    document.body.style.overflow = isOpen ? "hidden" : "";
}

// Close Mobile Drawer
function closeMobileMenu() {
    navMenu.classList.remove("open");
    hamburgerBtn.classList.remove("active");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    closeAllDropdowns();
}

// Close All Dropdowns
function closeAllDropdowns() {
    dropdowns.forEach(d => {
        d.classList.remove("open");
        const trigger = d.querySelector(".dropdown-trigger");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
}

// Dropdown Click Handlers
dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector(".dropdown-trigger");

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains("open");

        // Close other sibling dropdowns first (Accordion behavior)
        closeAllDropdowns();

        // Toggle clicked dropdown
        if (!isOpen) {
            dropdown.classList.add("open");
            trigger.setAttribute("aria-expanded", "true");
        }
    });
});

// Hamburger Click Handler
hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMobileMenu();
});

// Click Outside Handler (Closes open menus)
document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        closeAllDropdowns();
        if (navMenu.classList.contains("open")) {
            closeMobileMenu();
        }
    }
});

// Keyboard Accessibility: Escape key closes menus
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeAllDropdowns();
        closeMobileMenu();
    }
});

// Close mobile drawer when a navigation link is clicked
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        if (window.innerWidth <= 900) {
            closeMobileMenu();
        }
    });
});

// Resize listener: Reset inline mobile overflow if window expands to desktop
window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        document.body.style.overflow = "";
        navMenu.classList.remove("open");
        hamburgerBtn.classList.remove("active");
    }
});
