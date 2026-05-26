import Alpine from "alpinejs";

// Make Alpine available to the window object
// @ts-ignore
window.Alpine = Alpine;

document.addEventListener("DOMContentLoaded", () => {
    // Start Alpine
    Alpine.start();
    console.log("Alpine started");
});
