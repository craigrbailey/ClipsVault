var video = document.querySelector('.video');

video.addEventListener('mouseenter', function () {
  this.setAttribute('controls', 'controls');
});

video.addEventListener('mouseleave', function () {
  this.removeAttribute('controls');
});