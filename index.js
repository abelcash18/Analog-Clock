const hourHand   = document.getElementById('hour');
    const minuteHand = document.getElementById('minute');
    const secondHand = document.getElementById('second');

    function updateClock() {
      const now = new Date();

      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours   = now.getHours();

      // Smooth angles (including fractional movement)
      const secondsDeg = (seconds / 60) * 360 + 90;          // +90 because 12 o'clock is -90deg in CSS
      const minutesDeg = (minutes / 60) * 360 + (seconds / 60) * 6 + 90;
      const hoursDeg   = ((hours % 12) / 12) * 360 + (minutes / 60) * 30 + 90;

      secondHand.style.transform  = `translateX(-50%) rotate(${secondsDeg}deg)`;
      minuteHand.style.transform  = `translateX(-50%) rotate(${minutesDeg}deg)`;
      hourHand.style.transform    = `translateX(-50%) rotate(${hoursDeg}deg)`;
    }

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