import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad aplicadas a todas las respuestas.
 * La CSP permite los scripts propios de Next.js, las imágenes del bucket configurado
 * y las conexiones a la API de la propia aplicación.
 */
const imageHost = process.env.NEXT_PUBLIC_IMAGE_HOST ?? "";
/** Dominio del bucket al que el navegador sube las fotos con la URL firmada (ej. https://mi-bucket.s3.us-east-1.amazonaws.com). */
const uploadHost = process.env.NEXT_PUBLIC_UPLOAD_HOST ?? "";

const contentSecurityPolicy = [
  "default-src 'self'",
  // wasm-unsafe-eval: solo permite compilar WebAssembly (decodificador del modelo 3D), no eval de JavaScript.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${imageHost}`.trim(),
  "font-src 'self' data:",
  // blob: lo usa three.js para leer las texturas embebidas del modelo 3D (el archivo ya viene del mismo origen).
  `connect-src 'self' blob: ${uploadHost}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["argon2", "pg"],
  images: {
    remotePatterns: imageHost ? [new URL(`${imageHost}/**`)] : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
