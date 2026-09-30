import type { MetadataRoute } from "next"

const baseUrl = "https://technova-academy-ten.vercel.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}