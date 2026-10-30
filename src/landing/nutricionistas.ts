import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fraunces/600.css';
import './nutricionistas.css';

const buttons = document.querySelectorAll<HTMLButtonElement>('[data-cycle]');

function showCycle(cycle: 'mes' | 'ano') {
  document.documentElement.dataset.cycle = cycle;
  buttons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.cycle === cycle));
  });
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    showCycle(button.dataset.cycle === 'ano' ? 'ano' : 'mes');
  });
});
