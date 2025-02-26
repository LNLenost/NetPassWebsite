document.addEventListener("DOMContentLoaded", function() {
    console.log("NetPass Website Loaded!");

    const darkModeToggle = document.getElementById("dark-mode-toggle");
    darkModeToggle.addEventListener("click", function() {
        document.body.classList.toggle("dark-mode");
        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
        } else {
            localStorage.setItem("darkMode", "disabled");
        }
    });

    // Load saved dark mode preference
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }
});