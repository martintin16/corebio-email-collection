/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Por defecto Next corta las Server Actions en 1 MB. El backend acepta
      // hasta 2 MB (por ejemplo, una plantilla larga); 3 MB deja lugar para
      // el resto del pedido. Los adjuntos no pasan por acá (van directo del
      // navegador al backend).
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
