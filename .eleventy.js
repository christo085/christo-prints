module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/nav.js");
  eleventyConfig.addPassthroughCopy("src/cart.js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/CPLogo.png");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  function eventDateValue(event) {
    return event && (event.dateISO || event.date);
  }

  function parsePrice(price) {
    if (typeof price === "number") return price;
    return parseFloat(String(price || "0").replace("£", "").replace("+", "")) || 0;
  }

  eleventyConfig.addFilter("upcomingWithin", function (events, months) {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() + months);
    return (events || []).filter(function (event) {
      var d = new Date(eventDateValue(event));
      return d >= now && d <= cutoff;
    });
  });

  eleventyConfig.addFilter("filterPastEvents", function (events) {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    return (events || []).filter(function (event) {
      var d = new Date(eventDateValue(event));
      return d >= now;
    });
  });

  eleventyConfig.addFilter("eventDisplayDate", function (event) {
    return event.displayDate || event.date;
  });

  eleventyConfig.addFilter("eventMachineDate", function (event) {
    return eventDateValue(event);
  });

  eleventyConfig.addFilter("priceNumber", function (price) {
    return parsePrice(price);
  });

  eleventyConfig.addFilter("activeSeasonal", function (items) {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    return (items || []).filter(function (item) {
      if (!item.activeFrom || !item.activeTo) return true;
      var from = new Date(item.activeFrom);
      var to = new Date(item.activeTo);
      to.setHours(23, 59, 59, 999);
      return now >= from && now <= to;
    });
  });

  eleventyConfig.addFilter("resolveProductColours", function (productColours, allColoursData) {
    var all = [].concat(allColoursData.standard || [], allColoursData.special || []);
    if (!productColours || productColours.length === 0) {
      return all;
    }
    var lower = productColours.map(function (c) { return c.toLowerCase(); });
    return all.filter(function (c) {
      return lower.indexOf(c.name.toLowerCase()) !== -1;
    });
  });

  eleventyConfig.addFilter("activeOnly", function (items) {
    return (items || []).filter(function (item) {
      return item.active !== false;
    });
  });

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

  eleventyConfig.setServerOptions({
    host: "0.0.0.0",
    port: 8080,
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};
