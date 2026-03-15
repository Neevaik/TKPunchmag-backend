function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");
}

module.exports = slugify;