const fs = require("fs");
const path = require("path");

class JsonStore {
  constructor(filePath, fallback) {
    this.filePath = filePath;
    this.fallback = fallback;
  }

  read() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, "utf8"));
    } catch {
      return this.fallback;
    }
  }

  write(value) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(value, null, 2));
  }
}

module.exports = { JsonStore };
