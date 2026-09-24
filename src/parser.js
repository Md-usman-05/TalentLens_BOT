const path = require("path")
const { PDFParse } = require("pdf-parse")
const mammoth = require("mammoth")

async function extractText(buffer, fileName) {
  const extension = path.extname(fileName).toLowerCase()

  if (extension === ".pdf") {
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    await parser.destroy()

    const text = result.text
      .replace(/\s+/g, " ")
      .trim()

    if (!text || text.length < 50) {
      throw new Error("DOCUMENT_TEXT_TOO_SHORT")
    }

    return text
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer })

    const text = result.value
      .replace(/\s+/g, " ")
      .trim()

    if (!text || text.length < 50) {
      throw new Error("DOCUMENT_TEXT_TOO_SHORT")
    }

    return text
  }

  throw new Error("UNSUPPORTED_FILE_TYPE")
}

module.exports = {
  extractText
}