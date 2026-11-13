import './professor-pip.css';
import {professorPipArt} from './professor-pip-art.js';
import {pipLessons} from './professor-pip-lessons.js';

let classroom;

export const pipLessonOpen = () => Boolean(classroom?.open);

export function openPipMilestone(slide, options) {
  if (slide) openPipLesson(null, {...options, milestone: slide});
}

export function mountPipLesson(container, mission, options) {
  if (!container) return null;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pip-lesson-button';
  button.textContent = 'Pip’s lesson';
  button.setAttribute('aria-haspopup', 'dialog');
  button.onclick = () => openPipLesson(mission, typeof options === 'function' ? options() : (options || {}));
  container.append(button);
  return button;
}

export function openPipLesson(mission, {deck = mission, step = 0, milestone, finishLabel = 'Back to mission', autoVoice = true, onFinish, onOpen, onClose} = {}) {
  if (pipLessonOpen()) return;
  const lesson = milestone ? {title: milestone.title, slides: [milestone]} : pipLessons[deck];
  if (!lesson) return;
  const {title, slides} = lesson;
  let page = Math.max(0, Math.min(step, slides.length - 1));
  let narration, speechWasPaused;
  let voiceEnabled = autoVoice;
  const opener = document.activeElement;
  const listeners = new AbortController();

  const panel = document.createElement('dialog');
  classroom = panel;
  panel.className = 'pip-classroom';
  panel.setAttribute('aria-labelledby', 'pip-classroom-title');
  panel.innerHTML = `
    <div class="pip-classroom-header">
      <div><p class="teacher-badge">Professor Pip</p><h2 id="pip-classroom-title"></h2></div>
      <button type="button" data-close autofocus>Close</button>
    </div>
    <div class="cartoon-teacher-stage">
      <div class="teacher-column">
        <div class="teacher-avatar-wrap">${professorPipArt}</div>
        <div class="teacher-sound-waves" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        <button type="button" class="teacher-voice-btn" hidden>Read aloud</button>
      </div>
      <div class="lesson-board-column">
        <div class="blackboard-card" aria-live="polite">
          <span class="lesson-slide-counter"></span>
          <h3></h3>
          <p class="blackboard-summary"></p>
          <p class="blackboard-fact-pill"></p>
        </div>
      </div>
    </div>
    <footer class="blackboard-footer">
      <div class="blackboard-btns">
        <button type="button" data-back>Back</button>
        <button type="button" data-next>Next</button>
      </div>
      <button type="button" class="primary" data-finish></button>
    </footer>`;
  const find = selector => panel.querySelector(selector);
  const stage = find('.cartoon-teacher-stage'), voice = find('.teacher-voice-btn');
  const back = find('[data-back]'), next = find('[data-next]'), finish = find('[data-finish]');
  const speech = typeof window !== 'undefined' ? window.speechSynthesis : null;

  function stopVoice() {
    if (narration) {
      narration = null;
      try { speech?.cancel(); } catch {}
    }
    stage.classList.remove('is-talking');
    if (speechWasPaused) {
      try { speech?.pause(); } catch {}
    }
    speechWasPaused = false;
    voice.textContent = 'Read aloud';
  }

  function speakSlide() {
    if (!speech || typeof window.SpeechSynthesisUtterance !== 'function') return;
    stopVoice();
    const slide = slides[page];
    if (!slide) return;
    const cleanText = `${slide.title}. ${slide.summary} ${slide.try}`.replace(/[\u{1F300}-\u{1F6FF}]/gu, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    speechWasPaused = speech.paused;
    try { speech.cancel(); } catch {}
    if (speechWasPaused) {
      try { speech.resume(); } catch {}
    }
    narration = utterance;
    utterance.rate = 0.95;
    utterance.pitch = 1.18;
    utterance.onstart = () => {
      if (narration === utterance) {
        stage.classList.add('is-talking');
      }
    };
    utterance.onend = utterance.onerror = () => {
      if (narration !== utterance) return;
      narration = null;
      stage.classList.remove('is-talking');
      voice.textContent = 'Read aloud';
    };
    voice.textContent = 'Stop reading';
    try {
      speech.speak(utterance);
    } catch {}
  }

  function render() {
    stopVoice();
    const slide = slides[page];
    find('.lesson-slide-counter').textContent = `Step ${page + 1} of ${slides.length}`;
    find('h3').textContent = slide.title;
    find('.blackboard-summary').textContent = slide.summary;
    find('.blackboard-fact-pill').textContent = slide.try;
    back.disabled = page === 0;
    next.disabled = page === slides.length - 1;

    if (voiceEnabled && speech && typeof window.SpeechSynthesisUtterance === 'function') {
      setTimeout(() => {
        if (classroom === panel && panel.open && voiceEnabled) {
          speakSlide();
        }
      }, 160);
    }
  }

  find('h2').textContent = title;
  finish.textContent = finishLabel;
  back.onclick = () => { page--; render(); };
  next.onclick = () => { page++; render(); };
  find('[data-close]').onclick = () => panel.close();
  finish.onclick = () => panel.close('finish');
  if (speech && typeof window.SpeechSynthesisUtterance === 'function') {
    voice.hidden = false;
    voice.onclick = () => {
      if (narration) {
        voiceEnabled = false;
        stopVoice();
      } else {
        voiceEnabled = true;
        speakSlide();
      }
    };
  }
  panel.addEventListener('close', () => {
    listeners.abort();
    stopVoice();
    panel.remove();
    onClose?.();
    if (panel.returnValue === 'finish') onFinish?.();
    if (opener?.isConnected && document.activeElement === document.body) opener.focus();
  }, {once: true});
  panel.addEventListener('keydown', event => {
    if (event.code !== 'Escape') event.stopPropagation();
  });
  window.addEventListener('pagehide', stopVoice, {once: true, signal: listeners.signal});
  document.body.append(panel);
  render();
  panel.showModal();
  onOpen?.();
}
