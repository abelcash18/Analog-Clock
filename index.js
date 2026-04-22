    class AnalogClock {
      constructor(selectors = {}) {
        this.hourHand = document.getElementById(selectors.hour || 'hour');
        this.minuteHand = document.getElementById(selectors.minute || 'minute');
        this.secondHand = document.getElementById(selectors.second || 'second');
        this.markersContainer = document.getElementById(selectors.markers || 'markers');
        this.digitalDisplay = document.getElementById(selectors.digital || 'digital');
        this.timezoneSelect = document.getElementById(selectors.timezone || 'timezoneSelect');
        this.darkModeToggle = document.getElementById(selectors.darkToggle || 'darkModeToggle');
        this.darkModeIcon = document.getElementById(selectors.darkIcon || 'darkModeIcon');
        this.format12HToggle = document.getElementById(selectors.format12H || 'format12HToggle');

        this.prevSecond = -1;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.format12H = localStorage.getItem('format12H') === 'true';
        this._intervalId = null;
        this._audioContext = null;
      }

      init() {
        this.generateNumbers();
        this.generateMarkers();
        this.bindEvents();
        this.applyStoredPreferences();
        this.updateClock();
        this._intervalId = setInterval(() => this.updateClock(), 50);
      }

      generateNumbers() {
        const numbersContainer = document.getElementById('numbers');
        if (!numbersContainer) return;
        numbersContainer.innerHTML = '';
        const size = Math.min(this.markersContainer.clientWidth || 380, this.markersContainer.clientHeight || 380);
        const radius = Math.max(120, Math.floor(size / 2) - 60);
        for (let i = 1; i <= 12; i++) {
          const angle = (i / 12) * 360 - 90; // 0 at top
          const num = document.createElement('div');
          num.className = 'number';
          const span = document.createElement('span');
          span.textContent = i.toString();
          num.appendChild(span);
         num.style.transform = `rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)`;
          numbersContainer.appendChild(num);
        }
      }

      generateMarkers() {
        this.markersContainer.innerHTML = '';
        for (let i = 0; i < 60; i++) {
          const markerLine = document.createElement('div');
          markerLine.classList.add('marker-line');
          if (i % 5 === 0) markerLine.classList.add('major');
          markerLine.style.transform = `rotate(${i * 6}deg)`;
          this.markersContainer.appendChild(markerLine);
        }
      }

      bindEvents() {
        this.darkModeToggle?.addEventListener('click', () => this.toggleDarkMode());
        this.timezoneSelect?.addEventListener('change', () => this.updateDigitalTime());
        this.format12HToggle?.addEventListener('click', () => this.toggle12HourFormat());
      }

      applyStoredPreferences() {
        if (this.isDarkMode) {
          this.toggleDarkModeVisuals();
        }
        if (this.format12H && this.format12HToggle) {
          this.format12HToggle.classList.add('active');
        }
      }

      toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.toggleDarkModeVisuals();
      }

      toggleDarkModeVisuals() {
        if (this.isDarkMode) {
          document.body.classList.remove('light-mode');
          document.body.classList.add('dark-mode');
          this.darkModeIcon && (this.darkModeIcon.textContent = '☀️');
          this.darkModeToggle.innerHTML = '<span id="darkModeIcon">☀️</span>';
          this.darkModeIcon = document.getElementById('darkModeIcon');
        } else {
          document.body.classList.remove('dark-mode');
          document.body.classList.add('light-mode');
          this.darkModeIcon && (this.darkModeIcon.textContent = '🌙');
          this.darkModeToggle.innerHTML = '<span id="darkModeIcon">🌙</span>';
          this.darkModeIcon = document.getElementById('darkModeIcon');
        }
      }

      toggle12HourFormat() {
        this.format12H = !this.format12H;
        localStorage.setItem('format12H', this.format12H);
        this.format12HToggle?.classList.toggle('active');
        this.updateDigitalTime();
      }

      playTickSound() {
        try {
          if (!this._audioContext) {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
          }
          const ctx = this._audioContext;
          if (ctx.state === 'suspended') ctx.resume();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 900;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.04);
        } catch (e) {
         console.warn('Audio API not supported or failed to play tick sound', e);
        }
      }

      getTimeParts(now = new Date()) {
        const timezone = this.timezoneSelect.value;
        if (timezone === 'local') {
          return { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), now };
        }
       
        try {
          const dtfParts = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).formatToParts(now);

          const p = Object.fromEntries(dtfParts.filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
          if (p.hour != null && !Number.isNaN(p.hour)) {
            return { hours: p.hour, minutes: p.minute, seconds: p.second, now };
          }

          const dtf = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const formatted = dtf.format(now);
          const m = formatted.match(/(\d{1,2}):?(\d{2}):?(\d{2})/);
          if (m) return { hours: Number(m[1]), minutes: Number(m[2]), seconds: Number(m[3]), now };
        } catch (e) {
          console.warn('Timezone parsing fallback triggered, using local time as fallback', e);
        }

        return { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), now };
      }

      updateDigitalTime() {
        const timezone = this.timezoneSelect?.value || 'local';
        const now = new Date();
        let timeString;
        const hour12 = this.format12H;
        if (timezone === 'local') {
          timeString = now.toLocaleTimeString('en-US', { hour12 });
        } else {
          timeString = now.toLocaleString('en-US', { 
            timeZone: timezone, 
            hour12,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
        this.digitalDisplay.textContent = timeString;
      }

      updateClock() {
        const { hours, minutes, seconds } = this.getTimeParts(new Date());

        if (this.prevSecond !== -1 && seconds !== this.prevSecond) {
          this.playTickSound();
        }
        this.prevSecond = seconds;

        const secondsDeg = (seconds / 60) * 360;
        const minutesDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
        const hoursDeg = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;

        this.secondHand.style.transform = `translateX(-50%) rotate(${secondsDeg}deg)`;
        this.minuteHand.style.transform = `translateX(-50%) rotate(${minutesDeg}deg)`;
        this.hourHand.style.transform = `translateX(-50%) rotate(${hoursDeg}deg)`;

        this.updateDigitalTime();
      }

      stop() {
        if (this._intervalId) {
          clearInterval(this._intervalId);
          this._intervalId = null;
        }
      }
    }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const clock = new AnalogClock();
    clock.init();
    window.clock = clock;
  });
} else {
  const clock = new AnalogClock();
  clock.init();
  window.clock = clock;
}