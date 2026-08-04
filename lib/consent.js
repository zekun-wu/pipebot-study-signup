// Consent form content — single source of truth used by both the
// booking page (display) and the signed-PDF generator (admin email attachment).

export const CONSENT_TITLE =
  "User Verification and Reuse of AI Agent Execution Workflows";

export const CONSENT_SECTIONS = [
  {
    heading: "Study Purpose",
    paragraphs: [
      "We are conducting a research study at Saarland University to investigate how users understand, verify, debug, and reuse AI agent task executions.",
      "AI agents can complete complex multi-step tasks, such as extracting information from documents, summarizing online information, updating spreadsheets, or producing structured outputs. However, users may not always understand how an agent completed a task, whether it made mistakes, or how a previous agent execution can be reused for a future related task.",
      "The goal of this study is to evaluate different interface designs for visualizing AI agent execution. In particular, we study whether post-task workflow graph visualizations help users understand, verify, debug, and reuse AI-agent workflows.",
    ],
  },
  {
    heading: "What Will Happen in This Study",
    paragraphs: [
      "If you agree to take part, you will participate in one study session lasting approximately 60 minutes.",
      "During the study, you may be asked to:",
    ],
    bullets: [
      "read task descriptions and inspect task materials, such as documents, files, spreadsheets, or other research-controlled materials;",
      "write prompts to delegate tasks to an AI agent;",
      "observe or inspect how an AI agent completes a task;",
      "use visualization tools such as post-task workflow graphs;",
      "judge whether the AI agent completed a task successfully;",
      "identify possible errors in the agent's execution;",
      "modify a prompt or workflow for a related follow-up task;",
      "answer questionnaires about your understanding, confidence, perceived effort, preference, and experience;",
      "provide written or spoken feedback about the system.",
    ],
    paragraphsAfter: [
      "The study may be conducted either in person in a lab or online through a study or crowdsourcing platform. The study procedure will be similar in both settings.",
      "In some parts of the study, the agent behavior may be pre-scripted or controlled by the researchers to ensure that all participants experience comparable task executions. In other parts, the prototype may execute your prompt or workflow edits directly.",
    ],
  },
  {
    heading: "Participation",
    paragraphs: [
      "Participation is entirely voluntary. You may stop the study at any time without giving a reason and without any negative consequences.",
      "You may also take breaks at any time during the study session.",
      "To participate, you must be at least 18 years old and have sufficient English proficiency to understand the task instructions and answer study questions. No programming experience or technical knowledge of AI agents is required.",
    ],
  },
  {
    heading: "Risks and Benefits",
    paragraphs: [
      "There are no known risks beyond normal computer-based study activities. You may experience mild fatigue, confusion, or frustration while completing task-based activities or inspecting AI-generated outputs.",
      "You may not receive a direct personal benefit from participating. However, your participation will help us better understand how to design AI-agent systems that are more transparent, controllable, debuggable, and reusable for end users.",
    ],
  },
  {
    heading: "Compensation",
    paragraphs: [
      "You will receive compensation for your participation.",
      "Compensation will be a 15 Euro Amazon gift card, provided after the study session.",
    ],
  },
  {
    heading: "Data Use and Confidentiality",
    paragraphs: ["We may collect the following data during the study:"],
    bullets: [
      "demographic information, such as age range, gender, education level, and prior experience with AI tools;",
      "prompts written by you;",
      "workflow edits made by you;",
      "interaction logs with the study prototype;",
      "task completion times;",
      "agent or workflow execution results;",
      "questionnaire responses;",
      "written feedback;",
      "researcher notes, for in-lab or moderated sessions;",
      "screen, audio, or video recordings.",
    ],
    paragraphsAfter: [
      "The study will not require you to provide private personal documents, workplace files, or sensitive personal information. Task materials will use synthetic, fictional, anonymized, or research-controlled data.",
      "How your data will be handled:",
    ],
    bulletsAfter: [
      "Data will be stored securely on password-protected computers, encrypted drives, or secure university servers.",
      "Identifying information will be stored separately from study data where possible.",
      "Only members of the research team will have access to identifiable data.",
      "Results will be reported only in anonymized or aggregated form.",
      "No identifiable recordings, screenshots, or raw interaction data will be published.",
      "Data will be used only for research purposes.",
    ],
  },
  {
    heading: "Consent",
    paragraphs: ["By signing below, you confirm that:"],
    bullets: [
      "You have read and understood the study information.",
      "You understand that participation is voluntary.",
      "You understand that you may stop or take a break at any time without giving a reason.",
      "You consent to the collection and processing of your data as described above.",
      "You understand that anonymized results may be used in research publications, presentations, or reports.",
    ],
  },
];
