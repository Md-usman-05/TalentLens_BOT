const skillAliases = {
  java: "java",
  "core java": "java",
  "core-java": "java",
  "java programming": "java",
  javascript: "javascript",
  js: "javascript",
  "java script": "javascript",
  react: "react",
  reactjs: "react",
  "react.js": "react",
  node: "nodejs",
  nodejs: "nodejs",
  "node.js": "nodejs",
  express: "express",
  expressjs: "express",
  "express.js": "express",
  python: "python",
  py: "python",
  django: "django",
  fastapi: "fastapi",
  sql: "sql",
  mysql: "sql",
  postgresql: "postgresql",
  postgres: "postgresql",
  mongodb: "mongodb",
  mongo: "mongodb",
  sqlite: "sqlite",
  typescript: "typescript",
  ts: "typescript",
  git: "git",
  github: "git",
  docker: "docker",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  aws: "aws",
  "amazon web services": "aws",
  azure: "azure",
  gcp: "gcp",
  "google cloud": "gcp",
  cloud: "cloud",
  "cloud technologies": "cloud",
  "cloud technology": "cloud",
  "cloud computing": "cloud",
  selenium: "selenium",
  jmeter: "jmeter",
  dynatrace: "dynatrace",
  appdynamics: "appdynamics",
  "app dynamics": "appdynamics",
  "spring boot": "springboot",
  springboot: "springboot",
  ".net": "dotnet",
  "asp.net": "dotnet",
  "asp.net core": "dotnet",
  csharp: "csharp",
  "c#": "csharp",
  "machine learning": "machine learning",
  ml: "machine learning",
  "artificial intelligence": "artificial intelligence",
  ai: "artificial intelligence",
  "image processing": "image processing",
  "object-oriented programming": "oop",
  oop: "oop",
  "data structures and algorithms": "dsa",
  dsa: "dsa",
  "rest api": "rest api",
  "rest apis": "rest api",
  "restful api": "rest api",
  "restful apis": "rest api",
  postman: "postman",
  "visual studio code": "vs code",
  "vs code": "vs code",
  debugging: "debugging",
  testing: "testing",
  "automation scripting": "automation",
  automation: "automation",
  esp32: "esp32",
  arduino: "arduino",
  iot: "iot"
}

function normalizeSkill(skill) {
  const value = String(skill)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")

  return skillAliases[value] || value
}

function uniqueSkills(skills) {
  const seen = new Set()
  const result = []

  for (const skill of skills || []) {
    const normalized = normalizeSkill(skill)

    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(skill)
    }
  }

  return result
}

function cleanSkillClassification(result) {
  const matched = uniqueSkills(result.matchedSkills)
  const partial = uniqueSkills(result.partialSkills)
  const missing = uniqueSkills(result.missingSkills)

  const matchedSet = new Set(
    matched.map(normalizeSkill)
  )

  const partialSet = new Set(
    partial.map(normalizeSkill)
  )

  const cleanPartial = partial.filter(
    skill => !matchedSet.has(normalizeSkill(skill))
  )

  const cleanMissing = missing.filter(skill => {
    const normalized = normalizeSkill(skill)

    return (
      !matchedSet.has(normalized) &&
      !partialSet.has(normalized)
    )
  })

  return {
    ...result,
    matchedSkills: matched,
    partialSkills: cleanPartial,
    missingSkills: cleanMissing
  }
}

function calculateBreakdown(result) {
  const required = uniqueSkills(result.requiredSkills)
  const preferred = uniqueSkills(result.preferredSkills)

  const matched = new Set(
    result.matchedSkills.map(normalizeSkill)
  )

  const partial = new Set(
    result.partialSkills.map(normalizeSkill)
  )

  let requiredScore = 100

  if (required.length > 0) {
    let points = 0

    for (const skill of required) {
      const normalized = normalizeSkill(skill)

      if (matched.has(normalized)) {
        points += 1
      } else if (partial.has(normalized)) {
        points += 0.5
      }
    }

    requiredScore =
      (points / required.length) * 100
  }

  let preferredScore = 100

  if (preferred.length > 0) {
    let points = 0

    for (const skill of preferred) {
      const normalized = normalizeSkill(skill)

      if (matched.has(normalized)) {
        points += 1
      } else if (partial.has(normalized)) {
        points += 0.5
      }
    }

    preferredScore =
      (points / preferred.length) * 100
  }

  const experienceScore = Math.max(
    0,
    Math.min(100, Number(result.experienceMatch) || 0)
  )

  const educationScore = Math.max(
    0,
    Math.min(100, Number(result.educationMatch) || 0)
  )

  const keywordScore = Math.max(
    0,
    Math.min(100, Number(result.keywordMatch) || 0)
  )

  const requiredContribution =
    requiredScore * 0.55

  const preferredContribution =
    preferredScore * 0.15

  const experienceContribution =
    experienceScore * 0.15

  const educationContribution =
    educationScore * 0.05

  const keywordContribution =
    keywordScore * 0.10

  const score =
    requiredContribution +
    preferredContribution +
    experienceContribution +
    educationContribution +
    keywordContribution

  return {
    requiredScore: Math.round(requiredScore),
    preferredScore: Math.round(preferredScore),
    experienceScore: Math.round(experienceScore),
    educationScore: Math.round(educationScore),
    keywordScore: Math.round(keywordScore),
    requiredContribution: Math.round(requiredContribution),
    preferredContribution: Math.round(preferredContribution),
    experienceContribution: Math.round(experienceContribution),
    educationContribution: Math.round(educationContribution),
    keywordContribution: Math.round(keywordContribution),
    total: Math.round(score)
  }
}

function calculateScore(result) {
  return calculateBreakdown(result).total
}

function compareResumes(resumes) {
  if (!resumes || resumes.length < 2) {
    return null
  }

  const comparison = resumes.map(resume => ({
    fileName: resume.fileName,
    score: resume.score,
    breakdown: resume.breakdown,
    matchedSkills: resume.analysis?.matchedSkills || [],
    partialSkills: resume.analysis?.partialSkills || [],
    missingSkills: resume.analysis?.missingSkills || []
  }))

  return comparison
}

function getCommonSkills(resumes) {
  const skillMaps = resumes.map(resume => {
    const skills = [
      ...(resume.analysis?.matchedSkills || []),
      ...(resume.analysis?.partialSkills || [])
    ]

    return new Map(
      skills.map(skill => [
        normalizeSkill(skill),
        skill
      ])
    )
  })

  if (!skillMaps.length) {
    return []
  }

  const common = []

  for (const [normalized, display] of skillMaps[0]) {
    if (
      skillMaps.every(map => map.has(normalized))
    ) {
      common.push(display)
    }
  }

  return common
}

module.exports = {
  normalizeSkill,
  cleanSkillClassification,
  calculateBreakdown,
  calculateScore,
  compareResumes,
  getCommonSkills
}