const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://weblegalmanager.com';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  trailingSlash: false
};
