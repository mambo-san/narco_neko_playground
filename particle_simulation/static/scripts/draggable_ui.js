// draggable_ui.js
export function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    el.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        isDragging = true;
        offsetX = e.clientX - el.getBoundingClientRect().left;
        offsetY = e.clientY - el.getBoundingClientRect().top;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
        el.style.transform = 'none';
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
}
  