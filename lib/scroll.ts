/** Route in-page scroll requests through Lenis when the landing page is mounted. */
export function scrollToSection(target: HTMLElement, block: 'start' | 'center' = 'start') {
  const request = new CustomEvent('finsight:scroll-to', { detail: { target, block }, cancelable: true });
  if (window.dispatchEvent(request)) {
    target.scrollIntoView({ block, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}
