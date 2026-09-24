const axios = require("axios")
require("dotenv").config()

const token = process.env.TELEGRAM_BOT_TOKEN
const baseUrl = `https://api.telegram.org/bot${token}`

async function sendMessage(chatId, text, options = {}) {
  const response = await axios.post(`${baseUrl}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...options
  })

  return response.data
}

async function getUpdates(offset = 0) {
  const response = await axios.get(`${baseUrl}/getUpdates`, {
    params: {
      offset,
      timeout: 30,
      allowed_updates: ["message", "callback_query"]
    }
  })

  return response.data.result
}

async function getFile(fileId) {
  const response = await axios.get(`${baseUrl}/getFile`, {
    params: {
      file_id: fileId
    }
  })

  return response.data.result
}

async function downloadFile(filePath) {
  const response = await axios.get(
    `https://api.telegram.org/file/bot${token}/${filePath}`,
    {
      responseType: "arraybuffer"
    }
  )

  return Buffer.from(response.data)
}

async function answerCallbackQuery(callbackQueryId) {
  await axios.post(`${baseUrl}/answerCallbackQuery`, {
    callback_query_id: callbackQueryId
  })
}

async function editMessage(
  chatId,
  messageId,
  text,
  options = {}
) {
  try {
    const response = await axios.post(
      `${baseUrl}/editMessageText`,
      {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        ...options
      }
    )

    return response.data
  } catch (error) {
    const description =
      error.response?.data?.description || ""

    if (
      description.includes(
        "message is not modified"
      )
    ) {
      return null
    }

    throw error
  }
}

module.exports = {
  sendMessage,
  getUpdates,
  getFile,
  downloadFile,
  answerCallbackQuery,
  editMessage
}