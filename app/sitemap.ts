import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const siteUrl = "https://technova-academy-ten.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("slug, updated_at")
    .eq("published", true);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/certificates`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/refund`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const coursePages: MetadataRoute.Sitemap = (courses || []).map(
    (course) => ({
      url: `${siteUrl}/courses/${course.slug}`,
      lastModified: course.updated_at
        ? new Date(course.updated_at)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    })
  );

  return [...staticPages, ...coursePages];
}