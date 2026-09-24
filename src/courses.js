const courses = [
  {
    skills: ["javascript", "js", "javascript es6"],
    title: "JavaScript Guide - MDN",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
  },
  {
    skills: ["html"],
    title: "HTML Tutorial - MDN",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
  },
  {
    skills: ["css"],
    title: "CSS Tutorial - MDN",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
  },
  {
    skills: ["react", "reactjs", "react.js"],
    title: "React Learn",
    url: "https://react.dev/learn"
  },
  {
    skills: ["node", "node.js", "nodejs"],
    title: "Node.js Learn",
    url: "https://nodejs.org/en/learn"
  },
  {
    skills: ["python"],
    title: "Python Tutorial",
    url: "https://docs.python.org/3/tutorial/"
  },
  {
    skills: ["java"],
    title: "Java Learn",
    url: "https://dev.java/learn/"
  },
  {
    skills: ["spring", "spring boot"],
    title: "Spring Learning",
    url: "https://spring.io/learn"
  },
  {
    skills: ["sql", "database", "relational database"],
    title: "SQL Tutorial - SQLBolt",
    url: "https://sqlbolt.com/"
  },
  {
    skills: ["mysql"],
    title: "MySQL Tutorial",
    url: "https://dev.mysql.com/doc/mysql-tutorial-excerpt/8.0/en/"
  },
  {
    skills: ["mongodb", "nosql", "nosql database"],
    title: "MongoDB University",
    url: "https://learn.mongodb.com/"
  },
  {
    skills: ["aws", "amazon web services"],
    title: "AWS Training and Certification",
    url: "https://aws.amazon.com/training/"
  },
  {
    skills: ["azure", "microsoft azure"],
    title: "Microsoft Learn - Azure",
    url: "https://learn.microsoft.com/en-us/training/azure/"
  },
  {
    skills: ["gcp", "google cloud", "google cloud platform"],
    title: "Google Cloud Skills Boost",
    url: "https://www.cloudskillsboost.google/"
  },
  {
    skills: ["docker", "container", "containers"],
    title: "Docker Get Started",
    url: "https://docs.docker.com/get-started/"
  },
  {
    skills: ["kubernetes", "k8s"],
    title: "Kubernetes Basics",
    url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/"
  },
  {
    skills: ["git", "github", "version control"],
    title: "Git Documentation",
    url: "https://git-scm.com/doc"
  },
  {
    skills: ["typescript"],
    title: "TypeScript Handbook",
    url: "https://www.typescriptlang.org/docs/handbook/"
  },
  {
    skills: ["django"],
    title: "Django Getting Started",
    url: "https://docs.djangoproject.com/en/stable/intro/"
  },
  {
    skills: ["fastapi"],
    title: "FastAPI Tutorial",
    url: "https://fastapi.tiangolo.com/tutorial/"
  },
  {
    skills: ["c#", ".net", "dotnet"],
    title: ".NET Learning",
    url: "https://dotnet.microsoft.com/en-us/learn"
  },
  {
    skills: ["machine learning", "ml"],
    title: "Machine Learning Crash Course",
    url: "https://developers.google.com/machine-learning/crash-course"
  },
  {
    skills: ["artificial intelligence", "ai"],
    title: "AI Fundamentals - Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/training/paths/get-started-with-artificial-intelligence/"
  },
  {
    skills: ["ai tools", "artificial intelligence tools", "ai applications"],
    title: "Generative AI Learning Path",
    url: "https://learn.microsoft.com/en-us/training/paths/introduction-generative-ai/"
  },
  {
    skills: ["opencv", "computer vision"],
    title: "OpenCV Tutorials",
    url: "https://docs.opencv.org/4.x/d9/df8/tutorial_root.html"
  },
  {
    skills: ["selenium", "test automation"],
    title: "Selenium Documentation",
    url: "https://www.selenium.dev/documentation/"
  },
  {
    skills: ["jmeter", "performance testing"],
    title: "Apache JMeter Documentation",
    url: "https://jmeter.apache.org/usermanual/"
  },
  {
    skills: ["rest api", "rest apis", "restful api", "api"],
    title: "REST API Tutorial",
    url: "https://restfulapi.net/"
  },
  {
    skills: ["oop", "oops", "object oriented programming"],
    title: "Object-Oriented Programming Guide",
    url: "https://docs.oracle.com/javase/tutorial/java/concepts/"
  },
  {
    skills: ["dsa", "data structures", "algorithms"],
    title: "Data Structures and Algorithms",
    url: "https://www.geeksforgeeks.org/dsa/"
  },

  {
    skills: [
      "mechanical engineering",
      "mechanical discipline",
      "mechanical engineering experience"
    ],
    title: "Introduction to Mechanical Engineering",
    url: "https://www.coursera.org/search?query=mechanical%20engineering"
  },
  {
    skills: [
      "electrical engineering",
      "electrical discipline",
      "electrical engineering experience"
    ],
    title: "Electrical Engineering Fundamentals",
    url: "https://www.coursera.org/search?query=electrical%20engineering"
  },
  {
    skills: [
      "instrumentation engineering",
      "instrumentation",
      "instrumentation engineering experience"
    ],
    title: "Instrumentation and Control Engineering",
    url: "https://www.coursera.org/search?query=instrumentation%20control"
  },
  {
    skills: [
      "process engineering",
      "process design",
      "process engineering experience"
    ],
    title: "Process Engineering",
    url: "https://www.coursera.org/search?query=process%20engineering"
  },
  {
    skills: [
      "capital projects",
      "capital project",
      "capital projects experience"
    ],
    title: "Project Management Principles",
    url: "https://www.coursera.org/search?query=project%20management"
  },
  {
    skills: [
      "project management",
      "project management experience"
    ],
    title: "Project Management",
    url: "https://www.coursera.org/search?query=project%20management"
  },
  {
    skills: [
      "stakeholder management",
      "client-facing stakeholder experience",
      "stakeholder communication"
    ],
    title: "Stakeholder Management",
    url: "https://www.coursera.org/search?query=stakeholder%20management"
  },
  {
    skills: [
      "p&id",
      "p&ids",
      "p&id development",
      "piping and instrumentation diagrams"
    ],
    title: "Piping and Instrumentation Diagrams",
    url: "https://www.coursera.org/search?query=piping%20instrumentation%20diagram"
  },
  {
    skills: [
      "mass balance",
      "mass and energy balance",
      "mass and energy balance calculations"
    ],
    title: "Material and Energy Balances",
    url: "https://www.coursera.org/search?query=material%20energy%20balances"
  },
  {
    skills: [
      "process simulation",
      "process modeling"
    ],
    title: "Process Engineering and Simulation",
    url: "https://www.coursera.org/search?query=process%20engineering%20simulation"
  },
  {
    skills: [
      "design calculations",
      "engineering calculations"
    ],
    title: "Engineering Design Fundamentals",
    url: "https://www.coursera.org/search?query=engineering%20design"
  },
  {
    skills: [
      "api standards",
      "engineering standards",
      "industry standards"
    ],
    title: "Engineering Standards and Practices",
    url: "https://www.coursera.org/search?query=engineering%20standards"
  }
]

const aliases = {
  "js": "javascript",
  "javascript es6": "javascript",
  "reactjs": "react",
  "react.js": "react",
  "nodejs": "node.js",
  "node": "node.js",
  "nosql databases": "nosql",
  "nosql database": "nosql",
  "mongodb database": "mongodb",
  "amazon web services": "aws",
  "microsoft azure": "azure",
  "google cloud platform": "gcp",
  "docker containers": "docker",
  "k8s": "kubernetes",
  "restful api": "rest api",
  "rest apis": "rest api",
  "object oriented programming": "oop",
  "object-oriented programming": "oop",
  "data structures": "dsa",
  "data structures and algorithms": "dsa",
  "machine-learning": "machine learning",
  "artificial-intelligence": "artificial intelligence",
  "ai tools": "ai tools",
  "mechanical engineering experience": "mechanical engineering",
  "mechanical discipline experience": "mechanical discipline",
  "electrical engineering experience": "electrical engineering",
  "electrical discipline experience": "electrical discipline",
  "instrumentation engineering experience": "instrumentation engineering",
  "capital project experience": "capital projects",
  "capital projects experience": "capital projects",
  "client-facing stakeholder experience": "stakeholder management",
  "p&id development": "p&id",
  "mass and energy balance calculations": "mass and energy balance",
  "engineering calculations": "engineering calculations"
}

function normalizeSkill(skill) {
  return String(skill || "")
    .toLowerCase()
    .trim()
    .replace(/[–—]/g, "-")
}

function findCourse(skill) {
  const normalized =
    normalizeSkill(skill)

  const aliased =
    aliases[normalized] ||
    normalized

  let course =
    courses.find(item =>
      item.skills.some(
        itemSkill =>
          normalizeSkill(
            itemSkill
          ) === aliased
      )
    )

  if (course) {
    return course
  }

  const words =
    aliased
      .split(/[\s,/&()]+/)
      .filter(
        word =>
          word.length > 2
      )

  course =
    courses.find(item =>
      item.skills.some(
        itemSkill => {
          const candidate =
            normalizeSkill(
              itemSkill
            )

          return words.some(
            word =>
              candidate.includes(
                word
              ) ||
              word.includes(
                candidate
              )
          )
        }
      )
    )

  return course || null
}

function getCourses(
  missingSkills
) {
  if (
    !Array.isArray(
      missingSkills
    ) ||
    !missingSkills.length
  ) {
    return []
  }

  const results = []
  const used = new Set()

  for (
    const skill of missingSkills
  ) {
    const course =
      findCourse(skill)

    if (
      course &&
      !used.has(course.url)
    ) {
      results.push(course)

      used.add(
        course.url
      )
    }

    if (
      results.length >= 3
    ) {
      break
    }
  }

  return results
}

module.exports = {
  getCourses
}