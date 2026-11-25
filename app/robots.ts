import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin_veyra", "/api/"] },
    sitemap: "https://www.veyracreatives.com/sitemap.xml",
    host: "https://www.veyracreatives.com",
  };
}
