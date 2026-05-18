import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build standalone pour le Dockerfile multi-stage (deploy/web.Dockerfile)
  output: "standalone",
  // Le dossier tokens/ est en dehors de web/ — il faut le déclarer pour les traces du build standalone
  outputFileTracingRoot: require("path").join(__dirname, ".."),
};

export default nextConfig;
