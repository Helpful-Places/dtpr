// Vanilla JS accordion handler — delegated at document level so there is no
// per-section wiring. Toggles `aria-expanded` on the button and `hidden` on
// the associated panel identified by `aria-controls`.
export const accordionScript = `
(function(){
  function toggle(btn){
    var id=btn.getAttribute('aria-controls');if(!id)return;
    var panel=document.getElementById(id);if(!panel)return;
    var open=btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded', open?'false':'true');
    if(open){panel.setAttribute('hidden','');}else{panel.removeAttribute('hidden');}
  }
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest&&e.target.closest('[data-dtpr-collapsible]');
    if(t){e.preventDefault();toggle(t);}
  });
  // Space only — native <button> already fires click on Enter, and
  // intercepting Enter here would double-toggle in real browsers.
  document.addEventListener('keydown',function(e){
    if(e.key!==' '&&e.key!=='Spacebar')return;
    var t=e.target&&e.target.closest&&e.target.closest('[data-dtpr-collapsible]');
    if(t){e.preventDefault();toggle(t);}
  });
})();
`
