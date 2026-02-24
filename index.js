const hourHand   = document.getElementById('hour');
    const minuteHand = document.getElementById('minute');
    const secondHand = document.getElementById('second');
    const markersContainer = document.getElementById('markers');
    const digitalDisplay = document.getElementById('digital');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const timezoneSelect = document.getElementById('timezoneSelect');

    // Store previous second to detect change
    let prevSecond = -1;
    
    // Track dark mode state
    let isDarkMode = false;

    // Generate 60 minute marker lines dynamically
    function generateMarkers() {
      for (let i = 0; i < 60; i++) {
        const markerLine = document.createElement('div');
        markerLine.classList.add('marker-line');
        
        // Add 'major' class for every 5th marker (12, 1, 2, 3, 4 positions)
        if (i % 5 === 0) {
          markerLine.classList.add('major');
        }
        
        markerLine.style.transform = `rotate(${i * 6}deg)`;
        markersContainer.appendChild(markerLine);
      }
    }

    // Update digital time display with timezone support
    function updateDigitalTime() {
      const timezone = timezoneSelect.value;
      const now = new Date();
      
      let timeString;
      if (timezone === 'local') {
        timeString = now.toLocaleTimeString();
      } else {
        timeString = now.toLocaleString('en-US', { 
          timeZone: timezone,
          timeStyle: 'medium'
        });
      }
      
      digitalDisplay.textContent = timeString;
    }

    // Dark mode toggle functionality
    function toggleDarkMode() {
      isDarkMode = !isDarkMode;
      
      if (isDarkMode) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        darkModeIcon.textContent = '☀️';
        darkModeToggle.innerHTML = '<span id="darkModeIcon">☀️</span> Light Mode';
      } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        darkModeIcon.textContent = '🌙';
        darkModeToggle.innerHTML = '<span id="darkModeIcon">🌙</span> Dark Mode';
      }
    }

    // Play tick sound on seconds change
    function playTickSound() {
      // Create a simple tick sound using Web Audio API
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

    function updateClock() {
      const now = new Date();

      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours   = now.getHours();

      // Play tick sound when seconds change
      if (prevSecond !== -1 && seconds !== prevSecond) {
        playTickSound();
      }
      prevSecond = seconds;

      // Smooth angles (including fractional movement)
      const secondsDeg = (seconds / 60) * 360 + 90;          // +90 because 12 o'clock is -90deg in CSS
      const minutesDeg = (minutes / 60) * 360 + (seconds / 60) * 6 + 90;
      const hoursDeg   = ((hours % 12) / 12) * 360 + (minutes / 60) * 30 + 90;

      secondHand.style.transform  = `translateX(-50%) rotate(${secondsDeg}deg)`;
      minuteHand.style.transform  = `translateX(-50%) rotate(${minutesDeg}deg)`;
      hourHand.style.transform    = `translateX(-50%) rotate(${hoursDeg}deg)`;

      // Update digital time
      updateDigitalTime();
    }

    // Initialize
    generateMarkers();
    
    // Event listeners
    darkModeToggle.addEventListener('click', toggleDarkMode);
    timezoneSelect.addEventListener('change', updateDigitalTime);

    // Initial call + smooth update (~10 fps is enough for buttery feel)
    updateClock();
    setInterval(updateClock, 100);

    // Even smoother option: use requestAnimationFrame (uncomment if desired)
    /*
    function tick() {
      updateClock();
      requestAnimationFrame(tick);
    }
    tick();
    */
