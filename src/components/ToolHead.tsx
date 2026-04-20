import Head from "next/head";

interface ToolHeadProps {
  title: string;
  description: string;
  path: string;
  brandName?: string;
}

export function ToolHead({ title, description, path, brandName }: ToolHeadProps) {
  const brand = (brandName ?? "HYPOTHESIS").toUpperCase();
  const canonicalUrl = `https://hypothesis.sh${path}`;
  const ogImage = "https://hypothesis.sh/api/og?domain=hypothesis.sh";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    description,
    url: canonicalUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    creator: { "@type": "Person", name: "Keegan Donley", url: "https://keegan.codes" },
  };

  return (
    <Head>
      <title>{`${brand} — ${title.toUpperCase()}`}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <link rel="canonical" href={canonicalUrl} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
