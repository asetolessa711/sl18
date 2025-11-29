// scripts/validation/validate-content.js
// Validate demo_content.json against content_pack.schema.json

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv"); // JSON Schema validator

// Paths
const contentPath = path.join(__dirname, "../../content/demo_content.json");
const schemaPath = path.join(__dirname, "../../schemas/content_pack.schema.json");

// Load files
const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// Setup validator
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

// Run validation
let allValid = true;
if (Array.isArray(content)) {
  content.forEach((item, idx) => {
    const ok = validate(item);
    if (!ok) {
      allValid = false;
      console.error(`❌ Item ${idx} (id: ${item && item.id}) failed validation:`);
      console.error(validate.errors);
    }
  });
} else {
  const ok = validate(content);
  if (!ok) {
    allValid = false;
    console.error("❌ Validation failed. Errors:");
    console.error(validate.errors);
  }
}

if (allValid) {
  console.log("✅ demo_content.json is valid against content_pack.schema.json");
} else {
  process.exit(1);
}