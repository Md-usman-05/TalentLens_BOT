const express = require("express")
const dotenv = require("dotenv")
const path = require("path")
const fs = require("fs")

const {
  sendMessage,
  getUpdates,
  getFile,
  downloadFile,
  answerCallbackQuery,
  editMessage
} = require("./bot")

const {
  getSession,
  resetSession
} = require("./session")

const {
  extractText
} = require("./parser")

const {
  summarizeJD,
  analyzeResume,
  askTalentLens
} = require("./ai")

const {
  getCourses
} = require("./courses")

dotenv.config()

const app = express()
const PORT =
  process.env.PORT || 3000

app.use(express.json())

const TEMP_DIR =
  path.join(
    __dirname,
    "..",
    "temp"
  )

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(
    TEMP_DIR,
    {
      recursive: true
    }
  )
}

const MAX_RESUMES = 20
const TELEGRAM_LIMIT = 3900

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".docx"
]

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function unique(values) {
  return [
    ...new Set(
      (values || [])
        .map(value =>
          String(value || "")
            .trim()
        )
        .filter(Boolean)
    )
  ]
}

function normalizeSkill(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#./-]/g, "")
    .trim()
}

function getExtension(fileName) {
  return path
    .extname(
      String(fileName || "")
    )
    .toLowerCase()
}

function clamp(
  value,
  min,
  max
) {
  return Math.min(
    Math.max(
      Number(value) || 0,
      min
    ),
    max
  )
}

function formatScore(value) {
  return Math.round(
    clamp(
      value,
      0,
      100
    )
  )
}

function scoreBar(score) {
  const value =
    formatScore(score)

  const filled =
    Math.round(
      value / 10
    )

  return (
    "█".repeat(filled) +
    "░".repeat(
      10 - filled
    )
  )
}

function matchLabel(score) {
  if (score >= 85) {
    return "High match"
  }

  if (score >= 65) {
    return "Moderate match"
  }

  return "Low match"
}

function cancelKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "CANCEL",
          callback_data: "cancel"
        }
      ]
    ]
  }
}

function analyzeKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "ANALYZE RESUMES",
          callback_data: "analyze"
        }
      ],
      [
        {
          text: "CANCEL",
          callback_data: "cancel"
        }
      ]
    ]
  }
}

function resultKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "ASK TALENTLENS",
          callback_data: "ask"
        }
      ],
      [
        {
          text: "NEW ANALYSIS",
          callback_data: "new"
        }
      ]
    ]
  }
}

function askKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "VIEW MATCHBOARD",
          callback_data: "results"
        }
      ],
      [
        {
          text: "NEW ANALYSIS",
          callback_data: "new"
        }
      ]
    ]
  }
}

function normalizeSkills(
  skills
) {
  if (!Array.isArray(skills)) {
    return []
  }

  return unique(
    skills.map(skill => {
      if (
        typeof skill ===
        "string"
      ) {
        return skill
      }

      return (
        skill?.skill ||
        skill?.name ||
        skill?.title ||
        ""
      )
    })
  )
}

function prepareAnalysis(
  analysis
) {
  const data =
    analysis || {}

  return {
    score:
      formatScore(
        data.score ??
        data.atsScore ??
        0
      ),

    requiredScore:
      Number(
        data.requiredScore || 0
      ),

    preferredScore:
      Number(
        data.preferredScore || 0
      ),

    experienceScore:
      Number(
        data.experienceScore || 0
      ),

    educationScore:
      Number(
        data.educationScore || 0
      ),

    keywordScore:
      Number(
        data.keywordScore || 0
      ),

    matchedSkills:
      normalizeSkills(
        data.matchedSkills
      ),

    partialSkills:
      normalizeSkills(
        data.partialSkills
      ),

    missingSkills:
      normalizeSkills(
        data.missingSkills
      ),

    matchedRequiredSkills:
      normalizeSkills(
        data.matchedRequiredSkills
      ),

    partialRequiredSkills:
      normalizeSkills(
        data.partialRequiredSkills
      ),

    missingRequiredSkills:
      normalizeSkills(
        data.missingRequiredSkills
      ),

    matchedPreferredSkills:
      normalizeSkills(
        data.matchedPreferredSkills
      ),

    partialPreferredSkills:
      normalizeSkills(
        data.partialPreferredSkills
      ),

    missingPreferredSkills:
      normalizeSkills(
        data.missingPreferredSkills
      ),

    experienceMatch:
      formatScore(
        data.experienceMatch
      ),

    educationMatch:
      formatScore(
        data.educationMatch
      ),

    keywordMatch:
      formatScore(
        data.keywordMatch
      ),

    experience:
      data.experience ||
      "Not available",

    education:
      data.education ||
      "Not available",

    quickTake:
      data.quickTake ||
      "No additional summary available.",

    suggestions:
      Array.isArray(
        data.suggestions
      )
        ? data.suggestions
            .slice(0, 3)
        : []
  }
}

function getCoursesForSkills(
  skills
) {
  try {
    const courses =
      getCourses(
        unique(skills)
      )

    if (!Array.isArray(courses)) {
      return []
    }

    return courses
      .filter(
        course =>
          course &&
          course.url
      )
      .slice(0, 3)
  } catch (error) {
    console.error(
      "Course lookup error:",
      error.message
    )

    return []
  }
}

function countSkills(
  resumes,
  property
) {
  const counts =
    new Map()

  for (
    const resume of resumes
  ) {
    const skills =
      normalizeSkills(
        resume.analysis?.[
          property
        ]
      )

    const seen =
      new Set()

    for (
      const skill of skills
    ) {
      const key =
        normalizeSkill(skill)

      if (
        !key ||
        seen.has(key)
      ) {
        continue
      }

      seen.add(key)

      if (!counts.has(key)) {
        counts.set(
          key,
          {
            name: skill,
            count: 0
          }
        )
      }

      counts.get(key).count++
    }
  }

  return [
    ...counts.values()
  ].sort(
    (a, b) =>
      b.count -
      a.count
  )
}

function getCommonSkills(
  resumes
) {
  return countSkills(
    resumes,
    "matchedSkills"
  ).filter(
    item =>
      item.count >=
      Math.max(
        2,
        Math.ceil(
          resumes.length *
          0.5
        )
      )
  )
}

function getCommonGaps(
  resumes
) {
  return countSkills(
    resumes,
    "missingSkills"
  ).filter(
    item =>
      item.count >=
      Math.max(
        2,
        Math.ceil(
          resumes.length *
          0.5
        )
      )
  )
}

function getAllMissingSkills(
  resumes
) {
  return unique(
    resumes.flatMap(
      resume =>
        resume.analysis
          ?.missingSkills ||
        []
    )
  )
}

function getOverallSuggestions(
  resumes
) {
  const suggestions = []

  for (
    const resume of resumes
  ) {
    for (
      const suggestion of
        resume.analysis
          ?.suggestions || []
    ) {
      const value =
        typeof suggestion ===
        "string"
          ? suggestion
          : suggestion?.text ||
            suggestion?.suggestion ||
            suggestion?.action ||
            ""

      if (value) {
        suggestions.push(
          value
        )
      }
    }
  }

  return unique(
    suggestions
  ).slice(0, 6)
}

function buildScoreBreakdown(
  analysis
) {
  return [
    `Required Skills  ${analysis.requiredScore.toFixed(1)}/55`,
    `Preferred Skills  ${analysis.preferredScore.toFixed(1)}/15`,
    `Experience  ${analysis.experienceScore.toFixed(1)}/15`,
    `Education  ${analysis.educationScore.toFixed(1)}/5`,
    `Keyword Alignment  ${analysis.keywordScore.toFixed(1)}/10`,
    `<b>Total  ${analysis.score}.0/100</b>`
  ]
}

function buildCandidate(
  resume,
  rank
) {
  const analysis =
    resume.analysis

  const lines = []

  lines.push(
    `<b>${String(rank).padStart(
      2,
      "0"
    )}  ${escapeHtml(
      resume.fileName
    )}</b>`
  )

  lines.push("")

  lines.push(
    `<b>${analysis.score}/100</b>  ${scoreBar(
      analysis.score
    )}`
  )

  lines.push(
    `<i>${matchLabel(
      analysis.score
    )}</i>`
  )

  lines.push("")

  lines.push(
    "<b>Score Breakdown</b>"
  )

  lines.push(
    ...buildScoreBreakdown(
      analysis
    )
  )

  lines.push("")

  lines.push(
    `Matched ${analysis.matchedSkills.length} · Partial ${analysis.partialSkills.length} · Missing ${analysis.missingSkills.length}`
  )

  lines.push("")

  lines.push(
    "<b>Skills</b>"
  )

  if (
    analysis.matchedSkills
      .length
  ) {
    lines.push(
      escapeHtml(
        analysis.matchedSkills
          .slice(0, 12)
          .join(" · ")
      )
    )
  } else {
    lines.push(
      "No matched skills identified."
    )
  }

  if (
    analysis.partialSkills
      .length
  ) {
    lines.push("")

    lines.push(
      "<b>Partial</b>"
    )

    lines.push(
      escapeHtml(
        analysis.partialSkills
          .slice(0, 8)
          .join(" · ")
      )
    )
  }

  if (
    analysis.missingSkills
      .length
  ) {
    lines.push("")

    lines.push(
      "<b>Gaps</b>"
    )

    lines.push(
      escapeHtml(
        analysis.missingSkills
          .slice(0, 12)
          .join(" · ")
      )
    )
  }

  lines.push("")

  lines.push(
    `Experience ${analysis.experienceMatch}% · Education ${analysis.educationMatch}%`
  )

  if (
    analysis.experience &&
    analysis.experience !==
      "Not available"
  ) {
    lines.push("")

    lines.push(
      `<b>Experience</b> ${escapeHtml(
        analysis.experience
      )}`
    )
  }

  if (
    analysis.education &&
    analysis.education !==
      "Not available"
  ) {
    lines.push("")

    lines.push(
      `<b>Education</b> ${escapeHtml(
        analysis.education
      )}`
    )
  }

  if (analysis.quickTake) {
    lines.push("")

    lines.push(
      escapeHtml(
        analysis.quickTake
      )
    )
  }

  lines.push("")

  lines.push(
    "<b>Suggestions</b>"
  )

  if (
    analysis.suggestions
      .length
  ) {
    for (
      const suggestion of
        analysis.suggestions
    ) {
      lines.push(
        `• ${escapeHtml(
          suggestion
        )}`
      )
    }
  } else {
    lines.push(
      "• No additional suggestions available."
    )
  }

  return lines.join("\n")
}

function buildMatchboard(
  session
) {
  const resumes =
    [...session.resumes]
      .sort(
        (a, b) =>
          b.score -
          a.score
      )

  const lines = []

  const title =
    session.jd?.title ||
    session.jd?.role ||
    "Job Description"

  lines.push(
    "<b>TALENTLENS AI</b>"
  )

  lines.push(
    "<b>MATCHBOARD</b>"
  )

  lines.push("")

  lines.push(
    `<b>${escapeHtml(
      title
    )}</b>`
  )

  lines.push(
    `${resumes.length} resumes analyzed`
  )

  lines.push("")

  lines.push(
    "ATS-style comparison using the same criteria for every resume."
  )

  lines.push("")

  lines.push(
    "────────────────────"
  )

  for (
    let i = 0;
    i < resumes.length;
    i++
  ) {
    lines.push(
      buildCandidate(
        resumes[i],
        i + 1
      )
    )

    lines.push("")

    lines.push(
      "────────────────────"
    )

    lines.push("")
  }

  const commonSkills =
    getCommonSkills(
      resumes
    )

  const commonGaps =
    getCommonGaps(
      resumes
    )

  const allMissing =
    getAllMissingSkills(
      resumes
    )

  lines.push(
    "<b>OVERALL VIEW</b>"
  )

  lines.push("")

  lines.push(
    "<b>Common skills</b>"
  )

  if (
    commonSkills.length
  ) {
    for (
      const item of
        commonSkills.slice(
          0,
          10
        )
    ) {
      lines.push(
        `• ${escapeHtml(
          item.name
        )} — ${item.count}/${resumes.length}`
      )
    }
  } else {
    lines.push(
      "• No common skills identified."
    )
  }

  lines.push("")

  lines.push(
    "<b>Common skill gaps</b>"
  )

  if (
    commonGaps.length
  ) {
    for (
      const item of
        commonGaps.slice(
          0,
          10
        )
    ) {
      lines.push(
        `• ${escapeHtml(
          item.name
        )} — ${item.count}/${resumes.length}`
      )
    }
  } else {
    lines.push(
      "• No common skill gaps identified."
    )
  }

  const suggestions =
    getOverallSuggestions(
      resumes
    )

  if (
    suggestions.length
  ) {
    lines.push("")

    lines.push(
      "<b>Overall suggestions</b>"
    )

    for (
      const suggestion of
        suggestions
    ) {
      lines.push(
        `• ${escapeHtml(
          suggestion
        )}`
      )
    }
  }

  const courses =
    getCoursesForSkills(
      allMissing
    )

  lines.push("")

  lines.push(
    "<b>LEARNING RESOURCES</b>"
  )

  if (courses.length) {
    courses.forEach(
      (course, index) => {
        const title =
          course.title ||
          course.name ||
          `Course ${index + 1}`

        lines.push(
          `${index + 1}. <a href="${escapeHtml(
            course.url
          )}">${escapeHtml(
            title
          )}</a>`
        )
      }
    )
  } else {
    lines.push(
      "• No matching course resources found."
    )
  }

  lines.push("")

  lines.push(
    "<i>Scores are ATS-style estimates based on the supplied Job Description and resumes.</i>"
  )

  return {
    text:
      lines.join("\n"),
    reply_markup:
      resultKeyboard()
  }
}

async function sendLongMessage(
  chatId,
  text,
  options = {}
) {
  const value =
    String(text || "")

  if (
    value.length <=
    TELEGRAM_LIMIT
  ) {
    return sendMessage(
      chatId,
      value,
      options
    )
  }

  const chunks = []

  let remaining =
    value

  while (
    remaining.length >
    TELEGRAM_LIMIT
  ) {
    let cut =
      remaining.lastIndexOf(
        "\n",
        TELEGRAM_LIMIT
      )

    if (
      cut < 1000
    ) {
      cut =
        TELEGRAM_LIMIT
    }

    chunks.push(
      remaining.slice(
        0,
        cut
      )
    )

    remaining =
      remaining.slice(
        cut
      )
  }

  if (remaining) {
    chunks.push(
      remaining
    )
  }

  let result = null

  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {
    result =
      await sendMessage(
        chatId,
        chunks[i],
        i ===
          chunks.length - 1
          ? options
          : {}
      )
  }

  return result
}

async function sendWelcome(
  chatId
) {
  await sendMessage(
    chatId,
    [
      "<b>TALENTLENS AI</b>",
      "",
      "Intelligent Resume–Job Matching Assistant",
      "",
      "Compare one Job Description against multiple resumes.",
      "",
      "<b>Results include</b>",
      "",
      "• ATS-style score",
      "• Required and preferred skill matching",
      "• Experience and education match",
      "• Skill gaps",
      "• Suggestions",
      "• Learning resources"
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "START ANALYSIS",
              callback_data: "start"
            }
          ],
          [
            {
              text: "HOW IT WORKS",
              callback_data: "help"
            }
          ]
        ]
      }
    }
  )
}

async function sendHelp(
  chatId
) {
  await sendMessage(
    chatId,
    [
      "<b>HOW TALENTLENS WORKS</b>",
      "",
      "<b>STEP 1</b>",
      "Upload one Job Description.",
      "",
      "<b>STEP 2</b>",
      "Upload multiple resumes.",
      "",
      "<b>STEP 3</b>",
      "Tap ANALYZE RESUMES.",
      "",
      "<b>STEP 4</b>",
      "TalentLens creates one consolidated Matchboard.",
      "",
      "<b>MATCHBOARD</b>",
      "• ATS-style score",
      "• Score breakdown",
      "• Matched skills",
      "• Partial skills",
      "• Skill gaps",
      "• Experience",
      "• Education",
      "• Suggestions",
      "• Learning resources"
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "START ANALYSIS",
              callback_data: "start"
            }
          ]
        ]
      }
    }
  )
}

async function processDocument(
  chatId,
  message
) {
  const session =
    getSession(chatId)

  const document =
    message.document

  if (!document) {
    return
  }

  let telegramFile

  try {
    telegramFile =
      await getFile(
        document.file_id
      )
  } catch (error) {
    console.error(
      "Telegram file error:",
      error.message
    )

    await sendMessage(
      chatId,
      [
        "<b>FILE ERROR</b>",
        "",
        "I could not access that file.",
        "Please upload it again."
      ].join("\n")
    )

    return
  }

  const originalName =
    document.file_name ||
    telegramFile.file_path ||
    "document"

  const extension =
    getExtension(
      originalName
    )

  if (
    !ALLOWED_EXTENSIONS.includes(
      extension
    )
  ) {
    await sendMessage(
      chatId,
      [
        "<b>UNSUPPORTED FILE</b>",
        "",
        `Received: ${escapeHtml(
          originalName
        )}`,
        "",
        "Please upload a PDF or DOCX file."
      ].join("\n")
    )

    return
  }

  if (
    session.state ===
    "WAITING_JD"
  ) {
    await sendMessage(
      chatId,
      [
        "<b>PROCESSING JOB DESCRIPTION</b>",
        "",
        "Reading the uploaded document..."
      ].join("\n")
    )

    try {
      const buffer =
        await downloadFile(
          telegramFile.file_path
        )

      const text =
        await extractText(
          buffer,
          originalName
        )

      if (
        !text ||
        text.length < 50
      ) {
        throw new Error(
          "DOCUMENT_TEXT_TOO_SHORT"
        )
      }

      const jd =
        await summarizeJD(
          text
        )

      session.jdText =
        text

      session.jd =
        jd

      session.resumes =
        []

      session.state =
        "WAITING_RESUME"

      await sendMessage(
        chatId,
        [
          "<b>JOB DESCRIPTION READY</b>",
          "",
          `<b>${escapeHtml(
            jd?.title ||
            jd?.role ||
            "Job Description"
          )}</b>`,
          "",
          "<b>STEP 2 OF 2</b>",
          "",
          "Select all the resumes you want to compare and send them together."
        ].join("\n"),
        {
          reply_markup:
            analyzeKeyboard()
        }
      )
    } catch (error) {
      console.error(
        "JD processing error:",
        error
      )

      const rateLimit =
        error?.status === 429 ||
        error?.code ===
          "rate_limit_exceeded"

      await sendMessage(
        chatId,
        rateLimit
          ? [
              "<b>AI LIMIT REACHED</b>",
              "",
              "The AI service has temporarily reached its token limit.",
              "",
              "Please wait and try the Job Description again."
            ].join("\n")
          : [
              "<b>DOCUMENT PROCESSING ERROR</b>",
              "",
              "I could not process this Job Description.",
              "",
              "Please upload a readable PDF or DOCX."
            ].join("\n")
      )
    }

    return
  }

  if (
    session.state ===
      "WAITING_RESUME" ||
    session.state ===
      "WAITING_MORE"
  ) {
    if (
      session.resumes.length >=
      MAX_RESUMES
    ) {
      await sendMessage(
        chatId,
        [
          "<b>RESUME LIMIT REACHED</b>",
          "",
          `Maximum resumes: ${MAX_RESUMES}.`,
          "",
          "Tap ANALYZE RESUMES."
        ].join("\n"),
        {
          reply_markup:
            analyzeKeyboard()
        }
      )

      return
    }

    try {
      const buffer =
        await downloadFile(
          telegramFile.file_path
        )

      const text =
        await extractText(
          buffer,
          originalName
        )

      if (
        !text ||
        text.length < 50
      ) {
        throw new Error(
          "DOCUMENT_TEXT_TOO_SHORT"
        )
      }

      session.resumes.push({
        id:
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        fileName:
          originalName,

        text,

        score: 0,

        analysis: null
      })

      session.state =
        "WAITING_MORE"

      await sendMessage(
        chatId,
        [
          "<b>RESUMES READY</b>",
          "",
          `<b>${session.resumes.length} resumes received</b>`,
          "",
          ...session.resumes.map(
            resume =>
              `• ${escapeHtml(
                resume.fileName
              )}`
          ),
          "",
          "All resumes will be compared against the same Job Description."
        ].join("\n"),
        {
          reply_markup:
            analyzeKeyboard()
        }
      )
    } catch (error) {
      console.error(
        "Resume extraction error:",
        error
      )

      await sendMessage(
        chatId,
        [
          "<b>RESUME COULD NOT BE ADDED</b>",
          "",
          `File: ${escapeHtml(
            originalName
          )}`,
          "",
          "Please upload a readable PDF or DOCX."
        ].join("\n"),
        {
          reply_markup:
            analyzeKeyboard()
        }
      )
    }

    return
  }

  if (
    session.state ===
    "COMPLETED"
  ) {
    await sendMessage(
      chatId,
      [
        "The current analysis is complete.",
        "",
        "Tap NEW ANALYSIS to start again."
      ].join("\n"),
      {
        reply_markup:
          resultKeyboard()
      }
    )
  }
}

async function analyzeAll(
  chatId
) {
  const session =
    getSession(chatId)

  if (!session.jd) {
    await sendMessage(
      chatId,
      [
        "<b>JOB DESCRIPTION MISSING</b>",
        "",
        "Upload the Job Description first."
      ].join("\n"),
      {
        reply_markup:
          cancelKeyboard()
      }
    )

    return
  }

  if (
    !session.resumes.length
  ) {
    await sendMessage(
      chatId,
      [
        "<b>NO RESUMES</b>",
        "",
        "Upload at least one resume."
      ].join("\n")
    )

    return
  }

  const progress =
    await sendMessage(
      chatId,
      [
        "<b>ANALYZING RESUMES</b>",
        "",
        `Comparing ${session.resumes.length} resumes against the same Job Description.`,
        "",
        "Please wait..."
      ].join("\n")
    )

  try {
    for (
      let i = 0;
      i < session.resumes.length;
      i++
    ) {
      const resume =
        session.resumes[i]

      if (
        resume.analysis
      ) {
        continue
      }

      console.log(
        `Analyzing ${i + 1}/${session.resumes.length}: ${resume.fileName}`
      )

      const analysis =
        await analyzeResume(
          resume.text,
          session.jd
        )

      const prepared =
        prepareAnalysis(
          analysis
        )

      resume.analysis =
        prepared

      resume.score =
        prepared.score
    }

    session.state =
      "COMPLETED"

    const result =
      buildMatchboard(
        session
      )

    const progressId =
      progress?.message_id

    if (
      progressId &&
      result.text.length <=
        TELEGRAM_LIMIT
    ) {
      await editMessage(
        chatId,
        progressId,
        result.text,
        {
          reply_markup:
            result.reply_markup
        }
      )

      return
    }

    if (progressId) {
      const firstCut =
        result.text.lastIndexOf(
          "\n",
          TELEGRAM_LIMIT
        )

      const firstChunk =
        result.text.slice(
          0,
          firstCut > 500
            ? firstCut
            : TELEGRAM_LIMIT
        )

      await editMessage(
        chatId,
        progressId,
        firstChunk
      )

      await sendLongMessage(
        chatId,
        result.text.slice(
          firstChunk.length
        ),
        {
          reply_markup:
            result.reply_markup
        }
      )

      return
    }

    await sendLongMessage(
      chatId,
      result.text,
      {
        reply_markup:
          result.reply_markup
      }
    )
  } catch (error) {
    console.error(
      "Analysis error:",
      error
    )

    session.state =
      "WAITING_MORE"

    const rateLimit =
      error?.status === 429 ||
      error?.code ===
        "rate_limit_exceeded"

    const message =
      rateLimit
        ? [
            "<b>AI LIMIT REACHED</b>",
            "",
            "The AI service temporarily reached its token limit.",
            "",
            "Your uploaded resumes are still stored in this current session.",
            "",
            "Please wait and tap ANALYZE RESUMES again."
          ].join("\n")
        : [
            "<b>ANALYSIS COULD NOT BE COMPLETED</b>",
            "",
            "The resumes were received, but the analysis could not be completed.",
            "",
            "Please tap ANALYZE RESUMES again."
          ].join("\n")

    if (
      progress?.message_id
    ) {
      await editMessage(
        chatId,
        progress.message_id,
        message,
        {
          reply_markup:
            analyzeKeyboard()
        }
      )
    } else {
      await sendMessage(
        chatId,
        message,
        {
          reply_markup:
            analyzeKeyboard()
        }
      )
    }
  }
}

async function handleText(
  message
) {
  const chatId =
    message.chat.id

  const rawText =
    String(
      message.text || ""
    ).trim()

  const text =
    rawText.toLowerCase()

  const session =
    getSession(chatId)

  if (
    text === "/start" ||
    text.startsWith(
      "/start "
    )
  ) {
    resetSession(
      chatId
    )

    await sendWelcome(
      chatId
    )

    return
  }

  if (
    text === "/new"
  ) {
    resetSession(
      chatId
    )

    await sendMessage(
      chatId,
      [
        "<b>NEW ANALYSIS</b>",
        "",
        "Upload the Job Description as PDF or DOCX."
      ].join("\n"),
      {
        reply_markup:
          cancelKeyboard()
      }
    )

    return
  }

  if (
    text === "/help"
  ) {
    await sendHelp(
      chatId
    )

    return
  }

  if (
    text === "/cancel"
  ) {
    resetSession(
      chatId
    )

    await sendMessage(
      chatId,
      "<b>ANALYSIS CANCELLED</b>"
    )

    return
  }

  if (
    text === "/done"
  ) {
    await analyzeAll(
      chatId
    )

    return
  }

  if (
    session.state ===
    "ASKING"
  ) {
    try {
      const answer =
        await askTalentLens(
          session,
          rawText
        )

      await sendLongMessage(
        chatId,
        [
          "<b>TALENTLENS</b>",
          "",
          escapeHtml(
            answer
          )
        ].join("\n"),
        {
          reply_markup:
            askKeyboard()
        }
      )
    } catch (error) {
      console.error(
        "Ask error:",
        error.message
      )

      await sendMessage(
        chatId,
        [
          "<b>COULD NOT ANSWER</b>",
          "",
          "I couldn't process that question right now."
        ].join("\n"),
        {
          reply_markup:
            askKeyboard()
        }
      )
    }

    return
  }

  if (
    session.state ===
    "WAITING_JD"
  ) {
    await sendMessage(
      chatId,
      [
        "<b>JOB DESCRIPTION REQUIRED</b>",
        "",
        "Upload the Job Description as PDF or DOCX."
      ].join("\n")
    )

    return
  }

  if (
    session.state ===
      "WAITING_RESUME" ||
    session.state ===
      "WAITING_MORE"
  ) {
    await sendMessage(
      chatId,
      [
        "<b>RESUMES REQUIRED</b>",
        "",
        "Upload the resumes you want to compare.",
        "",
        "Then tap ANALYZE RESUMES."
      ].join("\n"),
      {
        reply_markup:
          analyzeKeyboard()
      }
    )

    return
  }

  if (
    session.state ===
    "COMPLETED"
  ) {
    await sendMessage(
      chatId,
      [
        "The current analysis is complete.",
        "",
        "Use NEW ANALYSIS to start again."
      ].join("\n"),
      {
        reply_markup:
          resultKeyboard()
      }
    )
  }
}

async function handleCallback(
  callbackQuery
) {
  const chatId =
    callbackQuery
      .message
      .chat
      .id

  const messageId =
    callbackQuery
      .message
      .message_id

  const action =
    callbackQuery.data

  await answerCallbackQuery(
    callbackQuery.id
  )

  const session =
    getSession(chatId)

  if (
    action === "start"
  ) {
    resetSession(
      chatId
    )

    await editMessage(
      chatId,
      messageId,
      [
        "<b>NEW ANALYSIS</b>",
        "",
        "<b>STEP 1 OF 2</b>",
        "",
        "Upload the Job Description as PDF or DOCX."
      ].join("\n"),
      {
        reply_markup:
          cancelKeyboard()
      }
    )

    return
  }

  if (
    action === "help"
  ) {
    await editMessage(
      chatId,
      messageId,
      [
        "<b>HOW TALENTLENS WORKS</b>",
        "",
        "<b>01</b> Upload one JD",
        "",
        "<b>02</b> Upload multiple resumes",
        "",
        "<b>03</b> Analyze all resumes",
        "",
        "<b>04</b> Review the Matchboard"
      ].join("\n"),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "START ANALYSIS",
                callback_data: "start"
              }
            ]
          ]
        }
      }
    )

    return
  }

  if (
    action === "analyze"
  ) {
    await analyzeAll(
      chatId
    )

    return
  }

  if (
    action === "ask"
  ) {
    if (
      session.state !==
        "COMPLETED" ||
      !session.resumes.length
    ) {
      await sendMessage(
        chatId,
        "Please complete an analysis first."
      )

      return
    }

    session.state =
      "ASKING"

    await editMessage(
      chatId,
      messageId,
      [
        "<b>ASK TALENTLENS</b>",
        "",
        "Ask a question about the current analysis.",
        "",
        "Examples:",
        "",
        "Why are the scores different?",
        "What skills are missing?",
        "Which skills are common?",
        "What should be learned?"
      ].join("\n"),
      {
        reply_markup:
          askKeyboard()
      }
    )

    return
  }

  if (
    action === "results"
  ) {
    if (
      !session.resumes.length
    ) {
      await sendMessage(
        chatId,
        "No completed analysis is available."
      )

      return
    }

    session.state =
      "COMPLETED"

    const result =
      buildMatchboard(
        session
      )

    await sendLongMessage(
      chatId,
      result.text,
      {
        reply_markup:
          result.reply_markup
      }
    )

    return
  }

  if (
    action === "new"
  ) {
    resetSession(
      chatId
    )

    await editMessage(
      chatId,
      messageId,
      [
        "<b>NEW ANALYSIS</b>",
        "",
        "Upload the Job Description as PDF or DOCX."
      ].join("\n"),
      {
        reply_markup:
          cancelKeyboard()
      }
    )

    return
  }

  if (
    action === "cancel"
  ) {
    resetSession(
      chatId
    )

    await editMessage(
      chatId,
      messageId,
      [
        "<b>ANALYSIS CANCELLED</b>",
        "",
        "Tap START ANALYSIS whenever you are ready."
      ].join("\n"),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "START ANALYSIS",
                callback_data: "start"
              }
            ]
          ]
        }
      }
    )
  }
}

async function handleUpdate(
  update
) {
  try {
    if (
      update.callback_query
    ) {
      await handleCallback(
        update.callback_query
      )

      return
    }

    if (!update.message) {
      return
    }

    if (
      update.message.document
    ) {
      await processDocument(
        update.message.chat.id,
        update.message
      )

      return
    }

    if (
      update.message.text
    ) {
      await handleText(
        update.message
      )
    }
  } catch (error) {
    console.error(
      "Update error:",
      error
    )
  }
}

let offset = 0

async function startPolling() {
  console.log(
    "TalentLens Telegram polling started..."
  )

  while (true) {
    try {
      const updates =
        await getUpdates(
          offset
        )

      for (
        const update of updates
      ) {
        offset =
          update.update_id + 1

        await handleUpdate(
          update
        )
      }
    } catch (error) {
      console.error(
        "Telegram polling error:",
        error.message
      )

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            3000
          )
      )
    }
  }
}

app.get(
  "/",
  (req, res) => {
    res.json({
      status: "ok",
      service:
        "TalentLens AI",
      telegram:
        "running"
    })
  }
)

app.listen(
  PORT,
  () => {
    console.log(
      `TalentLens server running on port ${PORT}`
    )

    startPolling()
  }
)