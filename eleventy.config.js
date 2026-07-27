// Eleventy configuration. You normally never need to touch this file.
module.exports = function (eleventyConfig) {
  // Copy static assets straight through to the built site.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });

  // An event counts as "upcoming" until ~6 hours after its start time,
  // so a signing happening today doesn't vanish mid-morning.
  const isUpcoming = (value) => {
    const d = value instanceof Date ? value : new Date(value);
    return d.getTime() >= Date.now() - 6 * 60 * 60 * 1000;
  };

  const allEvents = (api) => api.getFilteredByGlob("src/events/*.md");

  eleventyConfig.addCollection("upcomingEvents", (api) =>
    allEvents(api)
      .filter((e) => isUpcoming(e.data.date))
      .sort((a, b) => a.data.date - b.data.date)
  );

  eleventyConfig.addCollection("pastEvents", (api) =>
    allEvents(api)
      .filter((e) => !isUpcoming(e.data.date))
      .sort((a, b) => b.data.date - a.data.date)
  );

  // Friendly date formatting, e.g. "Saturday, September 12, 2026 at 2:00 PM".
  eleventyConfig.addFilter("readableDate", (value) => {
    const d = value instanceof Date ? value : new Date(value);
    // Render in UTC so the time shows exactly as typed, regardless of the
    // machine that builds the site (the CMS stores naive local wall-clock time).
    return d.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
