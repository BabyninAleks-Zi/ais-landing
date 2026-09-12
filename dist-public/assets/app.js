/* Progressive enhancement only. The full page is present in HTML without JS. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-navigation');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const setMenu = (open, returnFocus = false) => {
    if (!menu || !menuButton) return;
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (returnFocus) menuButton.focus();
  };
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (menu?.classList.contains('is-open') && !target.closest('.site-header')) setMenu(false);
    const link = target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href')?.slice(1);
    const destination = id ? document.getElementById(id) : null;
    if (!destination) return;
    event.preventDefault();
    setMenu(false);
    destination.scrollIntoView({behavior: reduceMotion.matches ? 'instant' : 'smooth', block:'start'});
    // Use the native hash without triggering a second scroll. Works under a repo subpath and file://.
    try { history.replaceState(null, '', '#' + id); } catch { /* local restrictive browsers */ }
    const heading = destination.querySelector('h1,h2') || destination;
    heading.setAttribute('tabindex', '-1');
    heading.focus({preventScroll:true});
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.classList.contains('is-open')) setMenu(false,true);
  });
  const mobileMedia = window.matchMedia('(max-width: 900px)');
  mobileMedia.addEventListener('change', () => setMenu(false));

  let scrollQueued = false;
  const navIds = [...new Set([...document.querySelectorAll('[data-nav]')].map(a=>a.dataset.nav))];
  const updateScroll = () => {
    scrollQueued=false;
    const maxScroll = Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const progress = document.querySelector('.reading-progress');
    if (progress instanceof HTMLElement) progress.style.width = `${Math.min(100,Math.max(0,scrollY/maxScroll*100))}%`;
    const threshold = (document.querySelector('.header-inner')?.getBoundingClientRect().height||88)+80;
    let active='';
    for(const id of navIds) if(document.getElementById(id)?.getBoundingClientRect().top<=threshold) active=id;
    document.querySelectorAll('[data-nav]').forEach(link=>{
      if(link.dataset.nav===active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', () => {if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}},{passive:true});
  window.addEventListener('resize',updateScroll,{passive:true});
  updateScroll();

  const tabs = [...document.querySelectorAll('[data-scenario]')];
  const selectTab = (tab, focus = false) => {
    for (const other of tabs) {
      const selected = other === tab;
      other.setAttribute('aria-selected', String(selected));
      other.setAttribute('tabindex', selected ? '0' : '-1');
      const panel = document.getElementById(other.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    }
    if (focus) tab.focus();
  };
  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let index = tabs.indexOf(tab);
      if (event.key==='ArrowRight') index=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft') index=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home') index=0;
      else if(event.key==='End') index=tabs.length-1;
      else return;
      event.preventDefault(); selectTab(tabs[index],true);
    });
  }

  const dialog = document.getElementById('materials-dialog');
  let lastDialogTrigger = null;
  if (dialog instanceof HTMLDialogElement) {
    document.querySelectorAll('[data-open-materials]').forEach(button=>button.addEventListener('click',()=>{
      lastDialogTrigger=button;
      dialog.showModal();
      document.body.classList.add('modal-open');
      dialog.querySelector('[data-close-materials]')?.focus();
    }));
    dialog.querySelector('[data-close-materials]')?.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter(element => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog) return;
      const r=dialog.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close();
    });
    dialog.addEventListener('close',()=>{
      document.body.classList.remove('modal-open');
      lastDialogTrigger?.focus({preventScroll:true});
    });
  }
  const expandedBeforePrint = new Set();
  window.addEventListener('beforeprint',()=>{
    document.querySelectorAll('details').forEach(details=>{
      if(!details.open){expandedBeforePrint.add(details);details.open=true;}
    });
  });
  window.addEventListener('afterprint',()=>{
    expandedBeforePrint.forEach(details=>details.open=false);
    expandedBeforePrint.clear();
  });
  document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
})();
