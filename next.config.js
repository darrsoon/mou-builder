const nextConfig = {
  reactStrictMode: true,
  // unpdf (pdf.js) — как есть из node_modules: проверка шапок таблиц по PDF (lib/google/orphan-headers.js)
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
