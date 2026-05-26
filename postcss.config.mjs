export default {
    plugins: {
        /** @type {import('tailwindcss').Config} */
        tailwindcss: { content: ["./*.html", "./*.js"] },
        autoprefixer: {
            theme: {
                extend: {
                    fontFamily: {
                        serif: ["Playfair Display", "serif"],
                        sans: ["Source Sans Pro", "sans-serif"],
                    },
                },
            },
        },
    },
};
