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

        this.prevSecond = -1;
        this.isDarkMode = false;
        this._intervalId = null;
      }

      init() {
        this.generateNumbers();
        this.generateMarkers();
        this.bindEvents();
        this.updateClock();
        this._intervalId = setInterval(() => this.updateClock(), 100);
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
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        this.timezoneSelect.addEventListener('change', () => this.updateDigitalTime());
      }

      toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        if (this.isDarkMode) {
          document.body.classList.remove('light-mode');
          document.body.classList.add('dark-mode');
          this.darkModeIcon && (this.darkModeIcon.textContent = '☀️');
          this.darkModeToggle.innerHTML = '<span id="darkModeIcon">☀️</span> Light Mode';
          this.darkModeIcon = document.getElementById('darkModeIcon');
        } else {
          document.body.classList.remove('dark-mode');
          document.body.classList.add('light-mode');
          this.darkModeIcon && (this.darkModeIcon.textContent = '🌙');
          this.darkModeToggle.innerHTML = '<span id="darkModeIcon">🌙</span> Dark Mode';
          this.darkModeIcon = document.getElementById('darkModeIcon');
        }
      }

      playTickSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
      }

      getTimeParts(now = new Date()) {
        const timezone = this.timezoneSelect.value;
        if (timezone === 'local') {
          return { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), now };
        }
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).formatToParts(now);
        const p = Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
        return { hours: p.hour, minutes: p.minute, seconds: p.second, now };
      }

      updateDigitalTime() {
        const timezone = this.timezoneSelect.value;
        const now = new Date();
        let timeString;
        if (timezone === 'local') timeString = now.toLocaleTimeString();
        else timeString = now.toLocaleString('en-US', { timeZone: timezone, timeStyle: 'medium' });
        this.digitalDisplay.textContent = timeString;
      }

      updateClock() {
        const { hours, minutes, seconds } = this.getTimeParts(new Date());

        if (this.prevSecond !== -1 && seconds !== this.prevSecond) this.playTickSound();
        this.prevSecond = seconds;

        // angles: 0 at 12 o'clock -> convert so 0° points right, subtract 90°
        const secondsDeg = (seconds / 60) * 360 - 90;
        const minutesDeg = (minutes / 60) * 360 + (seconds / 60) * 6 - 90;
        const hoursDeg = ((hours % 12) / 12) * 360 + (minutes / 60) * 30 + (seconds / 3600) * 30 - 90;

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

const clock = new AnalogClock();
  clock.init();
