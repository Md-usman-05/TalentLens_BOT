const Groq = require("groq-sdk")
require("dotenv").config()

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const MODEL = "openai/gpt-oss-20b"

function cleanArray(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return [
    ...new Set(
      value
        .map(item => {
          if (typeof item === "string") {
            return item.trim()
          }

          if (item && typeof item === "object") {
            return String(
              item.skill ||
              item.name ||
              item.title ||
              item.text ||
              ""
            ).trim()
          }

          return ""
        })
        .filter(Boolean)
    )
  ]
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.max(
    0,
    Math.min(
      100,
      number
    )
  )
}

function cleanText(value, fallback = "") {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim()
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

function parseJson(content) {
  let text = String(
    content || ""
  ).trim()

  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  try {
    return JSON.parse(text)
  } catch (error) {
    const start =
      text.indexOf("{")

    const end =
      text.lastIndexOf("}")

    if (
      start !== -1 &&
      end !== -1 &&
      end > start
    ) {
      return JSON.parse(
        text.slice(
          start,
          end + 1
        )
      )
    }

    throw error
  }
}

async function callAI(
  systemPrompt,
  userPrompt,
  maxCompletionTokens = 1800
) {
  try {
    const response =
      await groq.chat.completions.create({
        model: MODEL,

        messages: [
          {
            role: "system",
            content:
              systemPrompt
          },
          {
            role: "user",
            content:
              userPrompt
          }
        ],

        temperature: 0.1,

        reasoning_effort:
          "low",

        max_completion_tokens:
          maxCompletionTokens,

        response_format: {
          type: "json_object"
        }
      })

    const content =
      response
        .choices?.[0]
        ?.message?.content || "{}"

    return parseJson(
      content
    )
  } catch (error) {
    console.error(
      "Groq error:",
      error.status,
      error.message
    )

    throw error
  }
}

async function summarizeJD(
  jdText
) {
  const text =
    String(jdText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 18000)

  const systemPrompt = `
You are TalentLens AI.

Extract a concise structured representation of the supplied Job Description.

Return ONLY valid JSON.

Do not write explanations.
Do not repeat information.
Do not invent information.

Use exactly this structure:

{
  "title": "",
  "role": "",
  "company": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "responsibilities": [],
  "certifications": [],
  "tools": [],
  "experienceRequirement": "",
  "educationRequirement": ""
}

Rules:

requiredSkills:
Only skills explicitly required or clearly essential.

preferredSkills:
Only preferred, bonus, nice-to-have or additional skills.

requiredSkills maximum 25 items.

preferredSkills maximum 12 items.

responsibilities maximum 6 items.

certifications maximum 5 items.

tools maximum 10 items.

Use short skill names.

Do not put complete sentences inside skill arrays.

If something is unavailable, use an empty string or empty array.
`

  return await callAI(
    systemPrompt,
    `JOB DESCRIPTION:\n${text}`,
    1200
  )
}

function buildSkillDetails(
  skills,
  jdSkills,
  status
) {
  const jdMap =
    new Map(
      jdSkills.map(skill => [
        normalizeSkill(skill),
        skill
      ])
    )

  return skills.map(
    skill => {
      const original =
        jdMap.get(
          normalizeSkill(skill)
        ) || skill

      return {
        skill,
        requirement:
          original,
        evidence: "",
        reason:
          status === "matched"
            ? "The resume contains evidence of this required skill."
            : status === "partial"
              ? "The resume shows related or limited evidence for this requirement."
              : "The resume does not show sufficient evidence for this requirement."
      }
    }
  )
}

function calculateBreakdown(
  data,
  jd
) {
  const required =
    unique(
      jd.requiredSkills
    )

  const preferred =
    unique(
      jd.preferredSkills
    )

  const matchedRequired =
    unique(
      data.matchedRequiredSkills
    )

  const partialRequired =
    unique(
      data.partialRequiredSkills
    )

  const missingRequired =
    unique(
      data.missingRequiredSkills
    )

  const matchedPreferred =
    unique(
      data.matchedPreferredSkills
    )

  const partialPreferred =
    unique(
      data.partialPreferredSkills
    )

  const missingPreferred =
    unique(
      data.missingPreferredSkills
    )

  const requiredTotal =
    required.length

  const preferredTotal =
    preferred.length

  let requiredScore = 0

  if (requiredTotal > 0) {
    requiredScore =
      (
        (
          matchedRequired.length +
          partialRequired.length * 0.5
        ) /
        requiredTotal
      ) * 55
  }

  let preferredScore = 0

  if (preferredTotal > 0) {
    preferredScore =
      (
        (
          matchedPreferred.length +
          partialPreferred.length * 0.5
        ) /
        preferredTotal
      ) * 15
  } else {
    preferredScore = 15
  }

  const experienceMatch =
    cleanNumber(
      data.experienceMatch
    )

  const educationMatch =
    cleanNumber(
      data.educationMatch
    )

  const keywordMatch =
    cleanNumber(
      data.keywordMatch
    )

  const experienceScore =
    experienceMatch * 0.15

  const educationScore =
    educationMatch * 0.05

  const keywordScore =
    keywordMatch * 0.10

  const total =
    requiredScore +
    preferredScore +
    experienceScore +
    educationScore +
    keywordScore

  return {
    requiredScore:
      Number(
        requiredScore.toFixed(1)
      ),

    preferredScore:
      Number(
        preferredScore.toFixed(1)
      ),

    experienceScore:
      Number(
        experienceScore.toFixed(1)
      ),

    educationScore:
      Number(
        educationScore.toFixed(1)
      ),

    keywordScore:
      Number(
        keywordScore.toFixed(1)
      ),

    total:
      Math.round(total)
  }
}

async function analyzeResume(
  resumeText,
  jd
) {
  const text =
    String(resumeText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 22000)

  const required =
    unique(
      jd?.requiredSkills || []
    )

  const preferred =
    unique(
      jd?.preferredSkills || []
    )

  const systemPrompt = `
You are TalentLens AI, an objective resume-to-job matching engine.

Compare the resume ONLY against the supplied Job Description.

Return ONLY valid JSON.

Do not invent experience.
Do not assume a skill is present.
Do not treat similar skills as exact matches unless the evidence supports it.

Skill classification:

MATCHED:
The resume clearly demonstrates the requested skill.

PARTIAL:
The resume shows related, limited, indirect or incomplete evidence.

MISSING:
There is no sufficient evidence in the resume.

Separate required skills from preferred skills.

Use the exact skill names supplied in the JD lists whenever possible.

Return exactly:

{
  "matchedRequiredSkills": [],
  "partialRequiredSkills": [],
  "missingRequiredSkills": [],
  "matchedPreferredSkills": [],
  "partialPreferredSkills": [],
  "missingPreferredSkills": [],
  "experienceMatch": 0,
  "educationMatch": 0,
  "keywordMatch": 0,
  "experience": "",
  "education": "",
  "quickTake": "",
  "suggestions": []
}

Rules:

experienceMatch:
0-100 based only on the stated JD experience requirement.

educationMatch:
0-100 based only on the stated JD education requirement.

keywordMatch:
0-100 based on meaningful JD terminology appearing in the resume.

quickTake:
Maximum 45 words.
Factual and concise.

suggestions:
Maximum 3 short actionable suggestions.

Do not make hiring recommendations.

Required skills:
${JSON.stringify(required)}

Preferred skills:
${JSON.stringify(preferred)}
`

  const userPrompt = `
JOB DESCRIPTION:

${JSON.stringify(
  jd,
  null,
  2
)}

RESUME:

${text}
`

  const data =
    await callAI(
      systemPrompt,
      userPrompt,
      2200
    )

  const result = {
    matchedRequiredSkills:
      cleanArray(
        data.matchedRequiredSkills
      ),

    partialRequiredSkills:
      cleanArray(
        data.partialRequiredSkills
      ),

    missingRequiredSkills:
      cleanArray(
        data.missingRequiredSkills
      ),

    matchedPreferredSkills:
      cleanArray(
        data.matchedPreferredSkills
      ),

    partialPreferredSkills:
      cleanArray(
        data.partialPreferredSkills
      ),

    missingPreferredSkills:
      cleanArray(
        data.missingPreferredSkills
      ),

    experienceMatch:
      cleanNumber(
        data.experienceMatch
      ),

    educationMatch:
      cleanNumber(
        data.educationMatch
      ),

    keywordMatch:
      cleanNumber(
        data.keywordMatch
      ),

    experience:
      cleanText(
        data.experience,
        "Not available"
      ),

    education:
      cleanText(
        data.education,
        "Not available"
      ),

    quickTake:
      cleanText(
        data.quickTake,
        "No additional summary available."
      ),

    suggestions:
      cleanArray(
        data.suggestions
      ).slice(0, 3)
  }

  const breakdown =
    calculateBreakdown(
      result,
      jd
    )

  const matchedSkills =
    unique([
      ...result.matchedRequiredSkills,
      ...result.matchedPreferredSkills
    ])

  const partialSkills =
    unique([
      ...result.partialRequiredSkills,
      ...result.partialPreferredSkills
    ])

  const missingSkills =
    unique([
      ...result.missingRequiredSkills,
      ...result.missingPreferredSkills
    ])

  result.matchedSkills =
    matchedSkills

  result.partialSkills =
    partialSkills

  result.missingSkills =
    missingSkills

  result.matchedDetails =
    buildSkillDetails(
      matchedSkills,
      [
        ...required,
        ...preferred
      ],
      "matched"
    )

  result.partialDetails =
    buildSkillDetails(
      partialSkills,
      [
        ...required,
        ...preferred
      ],
      "partial"
    )

  result.missingDetails =
    buildSkillDetails(
      missingSkills,
      [
        ...required,
        ...preferred
      ],
      "missing"
    )

  result.requiredScore =
    breakdown.requiredScore

  result.preferredScore =
    breakdown.preferredScore

  result.experienceScore =
    breakdown.experienceScore

  result.educationScore =
    breakdown.educationScore

  result.keywordScore =
    breakdown.keywordScore

  result.score =
    breakdown.total

  result.atsScore =
    breakdown.total

  return result
}

async function askTalentLens(
  session,
  question
) {
  const resumeContext =
    session.resumes
      .map(
        (resume, index) => {
          const analysis =
            resume.analysis || {}

          return `
RESUME ${index + 1}
FILE: ${resume.fileName}
SCORE: ${resume.score}/100
MATCHED: ${(analysis.matchedSkills || []).join(", ")}
PARTIAL: ${(analysis.partialSkills || []).join(", ")}
MISSING: ${(analysis.missingSkills || []).join(", ")}
EXPERIENCE MATCH: ${analysis.experienceMatch || 0}
EDUCATION MATCH: ${analysis.educationMatch || 0}
KEYWORD MATCH: ${analysis.keywordMatch || 0}
SUMMARY: ${analysis.quickTake || ""}
`
        }
      )
      .join("\n")

  const response =
    await groq.chat.completions.create({
      model: MODEL,

      messages: [
        {
          role: "system",

          content: `
You are TalentLens AI.

Answer only from the supplied Job Description and resume analysis.

Be concise, factual and clear.

Do not invent information.
Do not make hiring recommendations.
Do not call anyone the best candidate.
Do not claim someone is perfect.

If information is unavailable, say so.
`
        },

        {
          role: "user",

          content:
            `JOB DESCRIPTION:\n${JSON.stringify(
              session.jd,
              null,
              2
            )}\n\nRESUME DATA:\n${resumeContext}\n\nQUESTION:\n${question}`
        }
      ],

      temperature: 0.2,

      reasoning_effort:
        "low",

      max_completion_tokens:
        1000
    })

  return (
    response
      .choices?.[0]
      ?.message?.content ||
    "I couldn't find enough information to answer that."
  )
}

module.exports = {
  summarizeJD,
  analyzeResume,
  askTalentLens
}