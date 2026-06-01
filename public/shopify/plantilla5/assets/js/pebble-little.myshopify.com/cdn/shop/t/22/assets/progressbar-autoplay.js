export function setupProgressbarAutoplay(carousel,options){
  if(!carousel || !carousel.swiperInstance || !options.autoplay) return;
  
  const autoplayDelay = options.autoplay.delay || 5e3;
  const progressbarEl = carousel.swiperInstance.pagination?.el;
  if(!progressbarEl) return;
  
  const progressbarFill = progressbarEl.querySelector(".swiper-pagination-progressbar-fill");
  if(!progressbarFill) return;
  
  const isHorizontal = carousel.swiperInstance.isHorizontal();
  const baseTransform = "translate3d(0,0,0)";
  
  progressbarFill.style.transition = "none";
  if (isHorizontal) {
    progressbarFill.style.transform = `${baseTransform} scaleX(0)`;
  } else {
    progressbarFill.style.transform = `${baseTransform} scaleY(0)`;
  }
  
  let progressAnimationRafId = null;
  
  const animateProgress = () => {
    if (!carousel.swiperInstance) return;
    if (progressAnimationRafId !== null) {
      cancelAnimationFrame(progressAnimationRafId);
    }
    
    requestAnimationFrame(() => {
      if (!carousel.swiperInstance) return;
      const isHorizontal2 = carousel.swiperInstance.isHorizontal();
      const baseTransform2 = "translate3d(0,0,0)";
      
      progressbarFill.style.transition = "none";
      if (isHorizontal2) {
        progressbarFill.style.transform = `${baseTransform2} scaleX(0)`;
      } else {
        progressbarFill.style.transform = `${baseTransform2} scaleY(0)`;
      }
      
      progressAnimationRafId = requestAnimationFrame(() => {
        progressAnimationRafId = requestAnimationFrame(() => {
          if (!carousel.swiperInstance) return;
          progressAnimationRafId = null;
          
          if (isHorizontal2) {
            progressbarFill.style.transition = `transform ${autoplayDelay}ms linear`;
            progressbarFill.style.transform = `${baseTransform2} scaleX(1)`;
          } else {
            progressbarFill.style.transition = `transform ${autoplayDelay}ms linear`;
            progressbarFill.style.transform = `${baseTransform2} scaleY(1)`;
          }
        });
      });
    });
  };
  
  carousel.swiperInstance.on("paginationRender", () => {
    if (!carousel.swiperInstance) return;
    progressbarFill.style.transition = "none";
    if (carousel.swiperInstance.isHorizontal()) {
      progressbarFill.style.transform = `${baseTransform} scaleX(0)`;
    } else {
      progressbarFill.style.transform = `${baseTransform} scaleY(0)`;
    }
  });
  
  carousel.swiperInstance.on("autoplayStart", animateProgress);
  
  carousel.swiperInstance.on("paginationUpdate", () => {
    if (!carousel.swiperInstance) return;
    if (carousel.swiperInstance.autoplay?.running) {
      animateProgress();
    }
  });
  
  let breakpointAnimationTimeout = null;
  carousel.swiperInstance.on("breakpoint", () => {
    if (!carousel.swiperInstance) return;
    if (breakpointAnimationTimeout) {
      clearTimeout(breakpointAnimationTimeout);
    }
    breakpointAnimationTimeout = setTimeout(() => {
      if (!carousel.swiperInstance) return;
      if (carousel.swiperInstance.autoplay?.running) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!carousel.swiperInstance) return;
            if (carousel.swiperInstance.autoplay?.running) {
              animateProgress();
            }
            breakpointAnimationTimeout = null;
          });
        });
      } else {
        breakpointAnimationTimeout = null;
      }
    }, 150);
  });
  
  let resizeAnimationTimeout = null;
  carousel.swiperInstance.on("resize", () => {
    if (!carousel.swiperInstance) return;
    if (resizeAnimationTimeout) {
      clearTimeout(resizeAnimationTimeout);
    }
    resizeAnimationTimeout = setTimeout(() => {
      if (!carousel.swiperInstance) return;
      if (carousel.swiperInstance.autoplay?.running) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!carousel.swiperInstance) return;
            if (carousel.swiperInstance.autoplay?.running) {
              animateProgress();
            }
            resizeAnimationTimeout = null;
          });
        });
      } else {
        resizeAnimationTimeout = null;
      }
    }, 150);
  });
  
  carousel.swiperInstance.on("autoplayStop", () => {
    if (progressAnimationRafId !== null) {
      cancelAnimationFrame(progressAnimationRafId);
      progressAnimationRafId = null;
    }
    progressbarFill.style.transition = "none";
  });
  
  carousel.swiperInstance.on("autoplayPause", () => {
    if (progressAnimationRafId !== null) {
      cancelAnimationFrame(progressAnimationRafId);
      progressAnimationRafId = null;
    }
  });
  
  animateProgress();
}
