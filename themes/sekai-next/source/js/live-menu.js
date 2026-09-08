window.SekaiPages.register('live', (scope) => {
  const phone = document.querySelector('.page-type-live .live-phone');
  if (!phone) return;
  // Fit the 800x720 design surface uniformly inside the independently stretched phone.
  // client dimensions exclude the phone's decorative rotation.
  const resize = () => {
    const scale = 1.08 * Math.min(phone.clientWidth * .8 / 800,phone.clientHeight * .4 / 720);
    phone.style.setProperty('--menu-scale', String(scale));
    // Halve the previous side gutters without scaling the text or card height.
    phone.style.setProperty('--menu-width', ((phone.clientWidth / scale + 800) / 2) + 'px');
  };
  resize();
  const observer=new ResizeObserver(resize);observer.observe(phone);scope.cleanup(()=>observer.disconnect());
  scope.listen(window,'pageshow', resize);
});
