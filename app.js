import { explainConcept } from './api.js';

const EXAMPLES = ['Explain blockchain', 'Explain APIs', 'Explain inflation'];

const topicInput = document.getElementById('topicInput');
const levelControl = document.getElementById('levelControl');
const styleToggle = document.getElementById('styleToggle');
const explainBtn = document.getElementById('explainBtn');
const outputSection = document.getElementById('outputSection');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const exampleChips = document.getElementById('exampleChips');

const simpleText = document.getElementById('simpleText');
const analogyText = document.getElementById('analogyText');
const exampleText = document.getElementById('exampleText');
const questionsList = document.getElementById('questionsList');

const copyBtn = document.getElementById('copyBtn');
const simplifyBtn = document.getElementById('simplifyBtn');
const deeperBtn = document.getElementById('deeperBtn');

let selectedStyle = 'Simple';
let selectedLevel = 'Kid';
let placeholderIndex = 0;

function rotatePlaceholder() {
  placeholderIndex = (placeholderIndex + 1) % EXAMPLES.length;
  topicInput.placeholder = EXAMPLES[placeholderIndex];
}

function initExampleChips() {
  EXAMPLES.forEach((example) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = example;
    chip.type = 'button';
    chip.addEventListener('click', () => {
      topicInput.value = example;
      topicInput.classList.add('has-content');
      topicInput.focus();
    });
    exampleChips.appendChild(chip);
  });
}

function setLoading(isLoading) {
  loadingState.classList.toggle('hidden', !isLoading);
  explainBtn.disabled = isLoading;
  explainBtn.textContent = isLoading ? 'Explaining…' : 'Explain Simply';
}

function setError(message = '') {
  errorState.textContent = message;
  errorState.classList.toggle('hidden', !message);
}

async function typeText(element, text) {
  element.textContent = '';
  for (let i = 0; i < text.length; i += 1) {
    element.textContent += text[i];
    await new Promise((resolve) => setTimeout(resolve, 6));
  }
}

async function renderOutput(result) {
  await typeText(simpleText, result.simpleExplanation);
  analogyText.textContent = result.analogy;
  exampleText.textContent = result.realWorldExample;

  questionsList.innerHTML = '';
  result.curiousQuestions.forEach((question) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    const text = document.createElement('span');
    const chevron = document.createElement('span');

    button.className = 'question-chip';
    button.type = 'button';
    text.textContent = question;
    chevron.textContent = '›';
    chevron.setAttribute('aria-hidden', 'true');

    button.append(text, chevron);
    button.addEventListener('click', () => {
      topicInput.value = question;
      topicInput.classList.add('has-content');
      runExplain();
    });

    li.appendChild(button);
    questionsList.appendChild(li);
  });

  outputSection.classList.remove('hidden');
  outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function runExplain() {
  setError('');
  outputSection.classList.add('hidden');
  setLoading(true);
  topicInput.classList.toggle('has-content', Boolean(topicInput.value.trim()));

  try {
    const result = await explainConcept({
      topic: topicInput.value.trim(),
      level: selectedLevel,
      style: selectedStyle,
    });
    await renderOutput(result);
  } catch (error) {
    setError(error.message || 'Something went wrong while explaining this topic.');
  } finally {
    setLoading(false);
  }
}

levelControl.addEventListener('click', (event) => {
  const target = event.target.closest('[data-level]');
  if (!target) return;

  selectedLevel = target.dataset.level;
  levelControl.querySelectorAll('.segment-pill').forEach((button) => {
    button.classList.toggle('is-active', button === target);
  });
});

styleToggle.addEventListener('click', (event) => {
  const target = event.target.closest('[data-style]');
  if (!target) return;

  selectedStyle = target.dataset.style;
  styleToggle.querySelectorAll('.toggle-pill').forEach((button) => {
    button.classList.toggle('is-active', button === target);
  });
});

explainBtn.addEventListener('click', runExplain);

topicInput.addEventListener('input', () => {
  topicInput.classList.toggle('has-content', Boolean(topicInput.value.trim()));
});

copyBtn.addEventListener('click', async () => {
  const content = [
    `Simple Explanation:\n${simpleText.textContent}`,
    `Analogy:\n${analogyText.textContent}`,
    `Real-world Example:\n${exampleText.textContent}`,
  ].join('\n\n');

  await navigator.clipboard.writeText(content);
  copyBtn.textContent = '✅ Copied!';
  setTimeout(() => {
    copyBtn.textContent = '📋 Copy';
  }, 1200);
});

simplifyBtn.addEventListener('click', () => {
  selectedLevel = 'Kid';
  levelControl.querySelectorAll('.segment-pill').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.level === 'Kid');
  });
  runExplain();
});

deeperBtn.addEventListener('click', () => {
  selectedLevel = 'Expert';
  levelControl.querySelectorAll('.segment-pill').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.level === 'Expert');
  });
  runExplain();
});

initExampleChips();
setInterval(rotatePlaceholder, 2500);
