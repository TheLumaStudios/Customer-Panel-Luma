import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, noIndex = false }) {
  const siteTitle = 'Luma Yazılım'
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
    </Helmet>
  )
}
