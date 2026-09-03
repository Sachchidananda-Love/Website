(() => {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.target.matches('input, textarea, select')) return;
    const stages = [...document.querySelectorAll('.painting-dialog[open] .painting-dialog__stage')];
    const activeStage = stages.reduce((current, stage) => {
      const rect = stage.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return !current || visible > current.visible ? { stage, visible } : current;
    }, null)?.stage;
    const direction = event.key === 'ArrowLeft' ? 'previous' : 'next';
    const arrow = activeStage?.querySelector(`.painting-dialog__view-arrow--${direction}`);
    if (!arrow) return;
    event.preventDefault();
    event.stopPropagation();
    arrow.click();
  }, true);

  window.setupArtworkDialogHistory = (dialog, closeDialog) => {
    let hasHistoryEntry = false;
    const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

    window.addEventListener('popstate', () => {
      if (!hasHistoryEntry || !dialog.open) return;
      hasHistoryEntry = false;
      closeDialog();
    });

    return {
      opened() {
        if (!isMobile() || hasHistoryEntry) return;
        window.history.pushState({ artworkDialog: true }, '');
        hasHistoryEntry = true;
      },
      closeRequested() {
        if (!hasHistoryEntry) return false;
        window.history.back();
        return true;
      }
    };
  };
})();
