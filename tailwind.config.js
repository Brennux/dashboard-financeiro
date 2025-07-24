/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    safelist: [
        'bg-red-100', 'bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100', 'bg-indigo-100', 'bg-yellow-100', 'bg-gray-100',
        'text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600', 'text-pink-600', 'text-indigo-600', 'text-yellow-600', 'text-gray-600'
    ]
}
