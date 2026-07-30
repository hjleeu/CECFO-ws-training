const nextConfig = {
    headers: async () => [
        {
            source: "/sw.js",
            headers: [
                { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                { key: "Content-Type", value: "application/javascript" }
            ]
        }
    ],
    output: "standalone"
}
export default nextConfig