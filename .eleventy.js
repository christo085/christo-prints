module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/nav.js");
  eleventyConfig.addPassthroughCopy("src/cart.js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/CPLogo.png");

  eleventyConfig.addFilter("groupByBadge", function (items) {
    const groups = {};
    (items || []).forEach(function (item) {
      const key = item.badge || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.keys(groups).map(function (badge) {
      return { badge: badge, items: groups[badge] };
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};
