export const metadata = {
    title: "Sitemap",
    description: "Sitemap for your website",
};

export default async function sitemap() {
    const baseUrl = "https://lawya.com"; //! Replace with your website URL
  
    // Static routes (e.g., homepage, about, contact)
    const staticRoutes = [
      { url: `${baseUrl}`, lastModified: new Date() },
      { url: `${baseUrl}/about`, lastModified: new Date() },
      { url: `${baseUrl}/contact`, lastModified: new Date() },
    ];
  
    // Dynamic routes (e.g., blog posts, products)
    // Fetch dynamic routes from your API or CMS
    const dynamicRoutes = await fetchDynamicRoutes(baseUrl); // Replace with your logic
  
    // Combine static and dynamic routes
    return [...staticRoutes, ...dynamicRoutes];
}

async function fetchDynamicRoutes(baseUrl: string) {

    // Replace this with your logic to fetch dynamic routes (e.g., from an API or CMS)
    const dynamicData = [
        { id: 1, slug: "blog-post-1", updatedAt: "2023-10-01" },
        { id: 2, slug: "blog-post-2", updatedAt: "2023-10-02" },
    ];

    return dynamicData.map((item) => ({
        url: `${baseUrl}/blog/${item.slug}`,
        lastModified: new Date(item.updatedAt),
    }));
}