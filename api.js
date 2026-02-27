const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const styleTemplates = {
  Simple: {
    analogyPrefix: "Think of it like",
    questionPrompt: "Want to learn even more?",
  },
  Analogy: {
    analogyPrefix: "Imagine",
    questionPrompt: "If this analogy makes sense, ask:",
  },
  "Step-by-step": {
    analogyPrefix: "A step-by-step way to picture it is",
    questionPrompt: "To go step-by-step, you could ask:",
  },
};

export async function explainConcept({ topic, level, style }) {
  await delay(1200);

  if (!topic || topic.trim().length < 3) {
    throw new Error("Please enter a topic with at least 3 characters.");
  }

  const tone =
    level === "Kid"
      ? "super simple with playful words"
      : level === "Expert"
      ? "clear but with more technical precision"
      : "simple, friendly, and practical";

  const template = styleTemplates[style] ?? styleTemplates.Simple;

  return {
    simpleExplanation: `${topic} works in a way that's ${tone}. The big idea is that smaller parts work together to create a useful result. Once you understand the core job each part does, the whole thing becomes much easier to follow.`,
    analogy: `${template.analogyPrefix} a team delivering pizzas: one person takes orders, one cooks, one drives. ${topic} is similar because different parts each have a role, and the final outcome only works when they coordinate.`,
    realWorldExample: `In real life, ${topic} shows up when apps or systems need to handle many steps quickly and clearly—like booking a ride, tracking a package, or streaming a video without pauses.`,
    curiousQuestions: [
      `What is the most important part of ${topic}?`,
      `What breaks if one part of ${topic} fails?`,
      `${template.questionPrompt}`,
    ],
  };
}
