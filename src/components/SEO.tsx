import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({
  title = "Cudliy - Design Your Dream Toys in 3D",
  description = "Transform your ideas into adorable 3D printed toys with Cudliy. Create custom toys using AI-powered design tools. From imagination to reality in minutes.",
  keywords = "3D design, toy design, AI toy maker, custom toys, 3D printing, personalized toys, kids toys, design platform, creative tools",
  image = "/Main Brand ICON.svg",
  url = "https://cudliy.com",
  type = "website"
}: SEOProps) => {
  const fullTitle = title.includes('Cudliy') ? title : `${title} | Cudliy`;
  const fullUrl = url.startsWith('http') ? url : `https://cudliy.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://cudliy.com${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Cudliy" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="Cudliy" />
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};

export default SEO;

