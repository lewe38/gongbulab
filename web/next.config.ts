import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Build standalone pour le Dockerfile multi-stage (deploy/web.Dockerfile)
  output: "standalone",
  // Le dossier tokens/ est en dehors de web/ — déclare la racine du workspace
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default withNextIntl(nextConfig);
