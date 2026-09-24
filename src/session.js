const sessions = new Map()

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      state: "WAITING_JD",
      jd: null,
      resumes: []
    })
  }

  return sessions.get(chatId)
}

function resetSession(chatId) {
  sessions.set(chatId, {
    state: "WAITING_JD",
    jd: null,
    resumes: []
  })
}

module.exports = {
  getSession,
  resetSession
}