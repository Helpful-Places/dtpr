/**
 * Live DTPR icons from api.dtpr.io (v5's pattern), with local SVG fallbacks so
 * offline playtests stay readable. The `people` (affected) icon ships in
 * ai@2026-07-03-beta which isn't deployed — composed locally like the API does.
 */
import type { Family, Shape } from '../content/system';

const API = 'https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements/';

export const FAM_COLOR: Record<Family, string> = {
  who: '#1f6f5c', data: '#2f5d86', where: '#7a5a2f', people: '#8a3b2f',
};

/* hexagon frame used by every composed DTPR icon */
const HEXPATH = 'M31.8564 8.8453L19 1.42265C18.3812 1.06538 17.6188 1.06538 17 1.42265L4.14359 8.8453C3.52479 9.20257 3.14359 9.86282 3.14359 10.5774V25.4226C3.14359 26.1372 3.52479 26.7974 4.14359 27.1547L17 34.5774C17.6188 34.9346 18.3812 34.9346 19 34.5774L31.8564 27.1547C32.4752 26.7974 32.8564 26.1372 32.8564 25.4226V10.5774C32.8564 9.86282 32.4752 9.20256 31.8564 8.8453Z';
const PEOPLE = '<path d="M13.5 10.6667C15.1569 10.6667 16.5 12.0098 16.5 13.6667C16.5 15.3235 15.1569 16.6667 13.5 16.6667C11.8431 16.6667 10.5 15.3235 10.5 13.6667C10.5 12.0098 11.8431 10.6667 13.5 10.6667Z"/><path d="M22.5 10.6667C24.1569 10.6667 25.5 12.0098 25.5 13.6667C25.5 15.3235 24.1569 16.6667 22.5 16.6667C20.8431 16.6667 19.5 15.3235 19.5 13.6667C19.5 12.0098 20.8431 10.6667 22.5 10.6667Z"/><path d="M13.5 18C10.1863 18 7.5 20.6863 7.5 24V25.3333H19.5V24C19.5 20.6863 16.8137 18 13.5 18Z"/><path d="M22.5 18C21.9316 18 21.3818 18.0791 20.8608 18.2266C22.1863 19.7061 23 21.6589 23 24V25.3333H28.5V24C28.5 20.6863 25.8137 18 22.5 18Z"/>';

/** composed people icon — the affected seat, made physical */
export const peopleIc = (s = 26): string =>
  `<svg width="${s}" height="${s}" viewBox="0 0 36 36" aria-hidden="true"><path d="${HEXPATH}" fill="none" stroke="#000" stroke-width="2"/><g fill="#000">${PEOPLE}</g></svg>`;

/* local symbol paths (from the schema's symbols/, via the v2 prototype) for offline fallback */
const SYM: Record<string, string> = {
  entry: `<path fill-rule="evenodd" clip-rule="evenodd" d="M17.8419 9C13.4479 9 9.7899 12.148 8.9999 16.312H17.8419V14.676C17.8419 14.139 18.4859 13.877 18.8669 14.246L22.1939 17.572C22.4319 17.812 22.4319 18.181 22.1939 18.419L18.8549 21.745C18.4859 22.127 17.8419 21.864 17.8419 21.328V19.688H8.9999C9.7899 23.852 13.4479 27 17.8419 27C22.8129 27 26.8419 22.971 26.8419 18C26.8419 13.029 22.8129 9 17.8419 9Z" fill="currentColor"/>`,
  biometric: `<path d="M9 27V18C9 13 13 9 18 9C23 9 27 13 27 18V27" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M13 25V18C13 15 15 12 18 12C21 12 23 15 23 18V25" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M16.5 23V18C16.5 16.5 17 15 18 15C19 15 19.5 16.5 19.5 18V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  perceptive: `<path d="M6 18 C 10 12, 14 9, 18 9 C 22 9, 26 12, 30 18 C 26 24, 22 27, 18 27 C 14 27, 10 24, 6 18 Z" stroke="currentColor" stroke-width="1.75" fill="none"/><circle cx="18" cy="18" r="4" fill="currentColor"/>`,
  matching: `<path d="M17.0463 18.0353C16.7692 18.0353 16.5117 18.1115 16.2809 18.234V15.8174H13.756C13.8368 16.037 13.8839 16.2757 13.8839 16.5266C13.8839 17.5778 13.1031 18.4303 12.1402 18.4303C11.1769 18.4303 10.3965 17.5778 10.3965 16.5266C10.3965 16.2753 10.4432 16.037 10.5244 15.8174H8V23.7288H16.281V21.3113C16.5118 21.4338 16.7693 21.5097 17.0464 21.5097C17.9755 21.5097 18.728 20.7318 18.728 19.7728C18.728 18.8131 17.9755 18.0352 17.0464 18.0352L17.0463 18.0353Z" fill="currentColor"/><path d="M25.5827 15.4478C25.7056 15.217 25.7815 14.9599 25.7815 14.6824C25.7815 13.7533 25.0028 13 24.0449 13C23.0845 13 22.3066 13.7533 22.3066 14.6824C22.3066 14.9599 22.3824 15.217 22.5058 15.4478H20.0892V17.9722C20.3079 17.8922 20.5475 17.8443 20.7979 17.8443C21.8491 17.8443 22.702 18.6247 22.702 19.5884C22.702 20.5513 21.8491 21.3321 20.7979 21.3321C20.5471 21.3321 20.3079 21.2854 20.0892 21.2038V23.729L28 23.729V15.4476L25.5827 15.4478Z" fill="currentColor"/>`,
  stored: `<path d="M18 7V19M14 15L18 19L22 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M9 22V26C9 27.66 10.34 29 12 29H24C25.66 29 27 27.66 27 26V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  thirdparty: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10.1162 22.581C10.4005 22.8573 10.881 22.6611 10.881 22.2607V20.626C11.768 20.5379 12.6309 20.3187 13.4557 19.9703C14.5159 19.5218 15.4668 18.8802 16.2837 18.0633C16.583 17.764 16.8583 17.4467 17.1106 17.1123V26.1868H15.591H15.5159C15.1155 26.1868 14.9193 26.6673 15.2046 26.9426L17.6872 29.4342C17.8654 29.6124 18.1406 29.6124 18.3188 29.4342L20.8014 26.9516C21.0777 26.6673 20.8815 26.1868 20.4811 26.1868H18.8894V17.1123C19.1407 17.4467 19.417 17.764 19.7163 18.0633C20.5332 18.8802 21.4852 19.5218 22.5453 19.9703C23.3691 20.3187 24.231 20.5379 25.119 20.626V22.2607C25.119 22.6611 25.5985 22.8573 25.8838 22.581L28.3664 20.0984C28.5445 19.9203 28.5445 19.645 28.3664 19.4668L25.8748 16.9842C25.5985 16.6999 25.119 16.8951 25.119 17.2955V17.3706V18.8351C24.4713 18.755 23.8406 18.5859 23.238 18.3306C22.3901 17.9722 21.6283 17.4587 20.9746 16.805C20.3209 16.1513 19.8074 15.3895 19.449 14.5416C19.0786 13.6647 18.8894 12.7327 18.8894 11.7717V7.32206C18.8894 6.83055 18.491 6.43213 17.9995 6.43213C17.509 6.43213 17.1106 6.83055 17.1106 7.32206V11.7717C17.1106 12.7327 16.9224 13.6647 16.551 14.5416C16.1926 15.3895 15.6791 16.1513 15.0254 16.805C14.3707 17.4587 13.6099 17.9722 12.762 18.3306C12.1584 18.5859 11.5287 18.755 10.881 18.8351V17.3706V17.2955C10.881 16.8951 10.4005 16.6999 10.1253 16.9842L7.63364 19.4668C7.45545 19.645 7.45545 19.9203 7.63364 20.0984L10.1162 22.581Z" fill="currentColor"/>`,
  retained: `<path fill-rule="evenodd" clip-rule="evenodd" d="M18 10.8887C17.04 10.8887 16.108 11.0767 15.232 11.4477C14.386 11.8057 13.625 12.3187 12.972 12.9717C12.318 13.6247 11.806 14.3857 11.447 15.2327C11.077 16.1087 10.889 17.0397 10.889 17.9997C10.889 18.9607 11.077 19.8917 11.447 20.7677C11.806 21.6147 12.318 22.3747 12.972 23.0287C13.625 23.6817 14.386 24.1947 15.232 24.5527C16.108 24.9237 17.04 25.1117 18 25.1117C18.96 25.1117 19.892 24.9237 20.768 24.5527C21.614 24.1947 22.375 23.6817 23.028 23.0287C23.682 22.3747 24.194 21.6147 24.553 20.7677C24.923 19.8917 25.111 18.9607 25.111 17.9997C25.111 17.0397 24.923 16.1087 24.553 15.2327C24.194 14.3857 23.682 13.6247 23.028 12.9717C22.375 12.3187 21.614 11.8057 20.768 11.4477C19.892 11.0767 18.96 10.8887 18 10.8887ZM18 26.8887C16.8 26.8887 15.636 26.6537 14.54 26.1897C13.481 25.7427 12.531 25.1017 11.715 24.2847C10.898 23.4697 10.258 22.5187 9.80996 21.4607C9.34596 20.3637 9.11096 19.1997 9.11096 17.9997C9.11096 16.8007 9.34596 15.6367 9.80996 14.5397C10.258 13.4807 10.898 12.5307 11.715 11.7147C12.531 10.8987 13.481 10.2577 14.54 9.80969C15.636 9.34669 16.8 9.11169 18 9.11169C19.199 9.11169 20.364 9.34669 21.46 9.80969C22.519 10.2577 23.47 10.8987 24.285 11.7147C25.102 12.5307 25.742 13.4807 26.19 14.5397C26.653 15.6367 26.889 16.8007 26.889 17.9997C26.889 19.1997 26.653 20.3637 26.19 21.4607C25.742 22.5187 25.102 23.4697 24.285 24.2847C23.47 25.1017 22.519 25.7427 21.46 26.1897C20.364 26.6537 19.199 26.8887 18 26.8887Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M20.667 21.5557C20.439 21.5557 20.212 21.4687 20.038 21.2957L17.111 18.3677V13.5557C17.111 13.0647 17.509 12.6667 18 12.6667C18.491 12.6667 18.889 13.0647 18.889 13.5557V17.6317L21.295 20.0377C21.643 20.3857 21.643 20.9487 21.295 21.2957C21.122 21.4687 20.895 21.5557 20.667 21.5557Z" fill="currentColor"/>`,
  enforcement: `<g transform="translate(18 18) scale(0.82) translate(-18 -18)"><path fill-rule="evenodd" clip-rule="evenodd" d="M27.6611 24.9668L13.8251 11.1308L11.1661 13.7888L25.0021 27.6248C25.3931 28.0158 26.0261 28.0158 26.4161 27.6248L27.6611 26.3798C28.0511 25.9888 28.0511 25.3568 27.6611 24.9668Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M21.458 13.0879C21.849 12.6979 21.849 12.0659 21.458 11.6749L18.076 8.29291C17.686 7.90191 17.053 7.90191 16.663 8.29291L14.711 10.2439L19.506 15.0399L21.458 13.0879Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.7109 21.4219C12.1009 21.8129 12.7339 21.8129 13.1249 21.4219L15.0759 19.4709L10.2799 14.6749L8.32891 16.6269C7.93891 17.0169 7.93891 17.6499 8.32891 18.0399L11.7109 21.4219Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M17.9946 26.001H8.9996C8.4476 26.001 7.9996 26.448 7.9996 27.001C7.9996 27.553 8.4476 28 8.9996 28H17.9946C18.5466 28 18.9946 27.553 18.9946 27.001C18.9946 26.448 18.5466 26.001 17.9946 26.001Z" fill="currentColor"/></g>`,
  scales: `<g transform="scale(1.0285714285714285)"><path d="M17.5 8 L17.5 26" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M14 26 L21 26" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M9 13 L17.5 11 L26 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M9 13 L6.5 19 L11.5 19 Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/><path d="M26 14 L23 21 L29 21 Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></g>`,
};

/** element id → local fallback symbol key */
const FALLBACK: Record<string, string> = {
  entry: 'entry',
  biometric_recognition: 'matching',
  input_biometric: 'biometric',
  output_decision: 'perceptive',
  stored_on_3rd_party_cloud: 'stored',
  available_to_vendor: 'thirdparty',
  data_retained: 'retained',
  civil_liberties_harm: 'enforcement',
  right_to_notice: 'perceptive',
  right_contest: 'scales',
  right_purpose_limitation: 'retained',
};

export function badge(shape: Shape, color: string, s = 22): string {
  const HEX = 'M31.86 8.85 19 1.42a2 2 0 0 0-2 0L4.14 8.85a2 2 0 0 0-1 1.73v14.84a2 2 0 0 0 1 1.73L17 34.58a2 2 0 0 0 2 0l12.86-7.43a2 2 0 0 0 1-1.73V10.58a2 2 0 0 0-1-1.73Z';
  const attrs = `fill="none" stroke="${color}" stroke-width="2.2"`;
  if (shape === 'hexagon') return `<svg class="badge" width="${s}" height="${s}" viewBox="0 0 36 36"><path d="${HEX}" ${attrs}/></svg>`;
  if (shape === 'circle') return `<svg class="badge" width="${s}" height="${s}" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14.5" ${attrs}/></svg>`;
  if (shape === 'octagon') return `<svg class="badge" width="${s}" height="${s}" viewBox="0 0 36 36"><polygon points="11,3 25,3 33,11 33,25 25,33 11,33 3,25 3,11" ${attrs}/></svg>`;
  return `<svg class="badge" width="${s}" height="${s}" viewBox="0 0 36 36"><rect x="4" y="4" width="28" height="28" rx="8" ${attrs}/></svg>`;
}

export function localSvg(el: string, shape: Shape, fam: Family, s: number): string {
  const key = FALLBACK[el];
  if (key && SYM[key]) {
    return `<svg width="${s}" height="${s}" viewBox="0 0 36 36" fill="none" style="color:#5c5545">${SYM[key]}</svg>`;
  }
  return badge(shape, FAM_COLOR[fam], s);
}

/** live icon <img> wrapped so a load error can swap in the local fallback */
export function ic(el: string | null, shape: Shape, fam: Family, s = 40): string {
  if (!el) return badge(shape, FAM_COLOR[fam], s);
  return `<span class="icw" data-el="${el}" data-shape="${shape}" data-fam="${fam}" data-s="${s}">` +
    `<img src="${API}${el}/icon.svg" width="${s}" height="${s}" alt="" loading="lazy" style="object-fit:contain;display:block"></span>`;
}

/** capture-phase error handler: swap any dead DTPR <img> for its local fallback */
export function installIconFallback(root: Document = document): void {
  root.addEventListener('error', (e) => {
    const img = e.target as HTMLElement;
    const wrap = img?.parentElement;
    if (!wrap?.classList?.contains('icw')) return;
    wrap.innerHTML = localSvg(
      wrap.dataset.el!, wrap.dataset.shape as Shape, wrap.dataset.fam as Family, Number(wrap.dataset.s),
    );
  }, true);
}
