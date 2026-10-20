import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  afterEveryRender,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  readonly i18n = inject(I18nService);
  readonly portfolio = inject(PortfolioService);

  readonly github = 'https://github.com/RaphaelMasset';
  readonly linkedin = 'https://www.linkedin.com/in/raphael-philippe-masset';

  readonly contactOpen = signal(false);
  readonly contactNotice = signal('');
  readonly mobileCurrent = signal(0);
  contactName = '';
  contactEmail = '';
  contactMessage = '';

  readonly showAbout = signal(false);

  /**
   * Position du film en “numéro de slide” (0.0 … 4.0).
   * Ce n’est PAS un signal : on la peint à la main dans le DOM pour éviter
   * qu’Angular relance tout le template (C1/C2/C3) à chaque event molette.
   */
  private pos = 0;
  private goal = 0;
  private vel = 0;
  private lastTick = 0;
  private lastInputAt = 0;
  /** true = le doigt ou le trackpad colle `pos` à `goal`. false = un ressort rattrape `goal`. */
  private direct = false;
  private physicsRaf = 0;

  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartPos = 0;
  private dragged = false;

  private mobileNeedsHome = true;
  private mobileReady = false;
  private mobileIgnoreUntil = 0;
  private mobileScaleRaf = 0;

  // 150px d’image + 12px de gap = un cran d’index.
  private readonly slotPx = 162;
  private readonly basePx = 150;
  private readonly largePx = 320;

  @ViewChild('track') private track?: ElementRef<HTMLElement>;
  @ViewChild('mobileReel') private mobileReel?: ElementRef<HTMLElement>;
  @ViewChildren('slideEl') private slideEls?: QueryList<ElementRef<HTMLElement>>;

  private onWheelBound = (event: WheelEvent) => this.onWheel(event);

  constructor() {
    // Angular peut recréer les slides (changement de langue, perte de focus).
    // On repeint pour que la slide active (première, ou dernière choisie) reste grande.
    afterEveryRender(() => {
      this.paint();
      const reel = this.mobileReel?.nativeElement;
      if (!reel) {
        return;
      }
      if (this.mobileNeedsHome) {
        this.mobileNeedsHome = false;
        this.homeMobileReel(reel);
      }
      if (this.mobileReady) {
        this.scaleMobileSlides(reel);
      }
    });
  }

  ngOnInit(): void {
    this.pos = this.portfolio.index();
    this.goal = this.pos;
    // runOutsideAngular : la molette ne doit PAS déclencher de change detection.
    // { passive: false } : obligatoire pour preventDefault (sinon la page scrolle).
    this.zone.runOutsideAngular(() => {
      window.addEventListener('wheel', this.onWheelBound, { passive: false });
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('wheel', this.onWheelBound);
    this.stopPhysics();
    this.vel = 0;
    if (this.mobileScaleRaf) {
      cancelAnimationFrame(this.mobileScaleRaf);
    }
  }

  get copy() {
    return this.i18n.copy();
  }

  get projects() {
    return this.portfolio.projects;
  }

  isMobile(): boolean {
    return window.matchMedia('(max-width: 600px)').matches;
  }

  private onWheel(event: WheelEvent): void {
    if (this.isMobile() || this.contactOpen() || this.showAbout()) {
      return;
    }

    event.preventDefault();
    const now = performance.now();
    const pixels =
      event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
    // 240 px = une image : deux fois moins vite. Un cran (~120 px) ne fait que la moitié du chemin.
    const deltaPos = pixels / 240;
    const discrete = event.deltaMode !== 0 || Math.abs(pixels) >= 50;
    this.goal = this.clamp(this.goal + deltaPos);
    if (discrete) {
      this.direct = false;
      this.vel = 0;
    } else {
      const dt = Math.max(8, this.lastInputAt === 0 ? 16 : now - this.lastInputAt);
      const sample = deltaPos / dt;
      this.vel = Math.max(-0.0012, Math.min(0.0012, this.vel * 0.5 + sample * 0.5));
      this.pos = this.goal;
      this.direct = true;
    }
    this.lastInputAt = now;
    this.startPhysics();
  }

  /**
   * transform uniquement (translate + scale). Changer width/height forcerait
   * le navigateur à recalculer le layout → saccades.
   */
  private paint(): void {
    const track = this.track?.nativeElement;
    const slides = this.slideEls;
    if (!track || !slides || slides.length === 0) {
      return;
    }

    const maxScale = this.largePx / this.basePx;
    const list = slides.toArray();
    const scales = list.map((_, i) => 1 + this.smooth(1 - Math.abs(this.pos - i)) * (maxScale - 1));

    // scale() ne pousse pas les voisines : sans ce décalage, la grande recouvre la suivante.
    let extraBefore = 0;
    const push = scales.map((scale) => {
      const shift = extraBefore;
      extraBefore += this.basePx * (scale - 1);
      return shift;
    });

    const last = list.length - 1;
    const i0 = Math.min(last, Math.max(0, Math.floor(this.pos)));
    const f = Math.min(1, Math.max(0, this.pos - i0));
    const leftOf = (i: number) => i * this.slotPx + push[i];
    const anchor = i0 === last ? leftOf(last) : leftOf(i0) * (1 - f) + leftOf(i0 + 1) * f;
    track.style.transform = `translate3d(${-anchor}px, 0, 0)`;

    list.forEach((ref, i) => {
      const el = ref.nativeElement;
      el.style.transform = `translate3d(${push[i]}px, 0, 0) scale(${scales[i]})`;
      el.style.zIndex = String(Math.round((scales[i] - 1) * 10));
    });

    const rounded = Math.round(this.pos);
    if (rounded !== this.portfolio.index()) {
      this.zone.run(() => this.portfolio.select(rounded));
    }
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(this.projects.length - 1, value));
  }

  /** Un seul cran (moitié du chemin) ne change pas d’image. */
  private snapTarget(): number {
    const base = Math.trunc(this.goal);
    const frac = this.goal - base;
    const step = frac > 0.5 ? 1 : frac < -0.5 ? -1 : 0;
    return this.clamp(base + step);
  }

  private smooth(t: number): number {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }

  private startPhysics(): void {
    if (this.physicsRaf) {
      return;
    }
    this.lastTick = performance.now();
    this.zone.runOutsideAngular(() => {
      const loop = (now: number) => {
        this.physicsRaf = requestAnimationFrame(loop);
        this.stepPhysics(now);
      };
      this.physicsRaf = requestAnimationFrame(loop);
    });
  }

  private stopPhysics(): void {
    if (this.physicsRaf) {
      cancelAnimationFrame(this.physicsRaf);
      this.physicsRaf = 0;
    }
  }

  /**
   * Pendant l’input : la position suit le geste.
   * Après : inertie (vitesse du geste) puis ressort vers l’image cible — pas de durée fixe.
   */
  private stepPhysics(now: number): void {
    const dt = Math.min(32, now - this.lastTick) || 16;
    this.lastTick = now;
    const idle = now - this.lastInputAt > 90;
    if (idle) {
      this.direct = false;
      this.goal = this.snapTarget();
    }
    if (this.direct) {
      this.paint();
      return;
    }

    const omega = 0.014;
    this.vel += (omega * omega * (this.goal - this.pos) - 2 * omega * this.vel) * dt;
    this.pos += this.vel * dt;
    this.pos = this.clamp(this.pos);
    if (Math.abs(this.pos - this.goal) < 0.002 && Math.abs(this.vel) < 0.00005) {
      this.pos = this.goal;
      this.vel = 0;
      this.paint();
      this.stopPhysics();
      return;
    }

    this.paint();
  }

  onPointerDown(event: PointerEvent): void {
    if (this.isMobile()) {
      return;
    }
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartPos = this.pos;
    this.dragged = false;
    this.vel = 0;
    this.goal = this.pos;
    this.direct = true;
    this.lastInputAt = performance.now();
    this.stopPhysics();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    const now = performance.now();
    const dx = event.clientX - this.dragStartX;
    if (Math.abs(dx) > 8) {
      this.dragged = true;
    }
    const next = this.clamp(this.dragStartPos - dx / this.slotPx);
    const dt = Math.max(8, now - this.lastInputAt);
    this.vel = Math.max(-0.004, Math.min(0.004, (next - this.pos) / dt));
    this.pos = next;
    this.goal = next;
    this.direct = true;
    this.lastInputAt = now;
    this.startPhysics();
  }

  onPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    this.dragPointerId = null;
    this.lastInputAt = performance.now();
    this.startPhysics();
  }

  openProject(index: number, event?: Event): void {
    if (this.dragged) {
      this.dragged = false;
      event?.preventDefault();
      return;
    }
    if (this.isMobile() && index !== this.mobileCurrent()) {
      return;
    }
    this.stopPhysics();
    this.vel = 0;
    this.direct = false;
    this.pos = index;
    this.goal = index;
    this.paint();
    this.portfolio.select(index);
    void this.router.navigate(['/project', this.projects[index].slug]);
  }

  onMobileScroll(event: Event): void {
    const scroller = event.target as HTMLElement;
    this.scheduleMobileScale(scroller);
    if (!this.mobileReady || performance.now() < this.mobileIgnoreUntil) {
      return;
    }
    this.syncIndexFromCrossing(scroller);
  }

  private homeMobileReel(reel: HTMLElement): void {
    this.mobileReady = false;
    this.mobileIgnoreUntil = performance.now() + 400;
    this.mobileCurrent.set(0);
    this.portfolio.select(0);
    const first = reel.querySelector('.mobile-slide');
    requestAnimationFrame(() => {
      first?.scrollIntoView({ block: 'center', behavior: 'instant' });
      this.scaleMobileSlides(reel);
      this.mobileReady = true;
    });
  }

  private scheduleMobileScale(scroller: HTMLElement): void {
    if (this.mobileScaleRaf) {
      return;
    }
    this.mobileScaleRaf = requestAnimationFrame(() => {
      this.mobileScaleRaf = 0;
      this.scaleMobileSlides(scroller);
    });
  }

  /** Scale GPU (pas de width) : le layout du scroll ne bouge pas. */
  private scaleMobileSlides(scroller: HTMLElement): void {
    const slides = scroller.querySelectorAll('.mobile-slide');
    const viewMid = scroller.scrollTop + scroller.clientHeight * 0.5;
    const narrow = scroller.clientWidth < 300;
    const minScale = 56 / 84;
    slides.forEach((node) => {
      const slide = node as HTMLElement;
      const img = slide.querySelector('img') as HTMLElement | null;
      if (!img) {
        return;
      }
      if (narrow) {
        img.style.transform = 'scale(1)';
        return;
      }
      const center = slide.offsetTop + slide.offsetHeight / 2;
      const dist = Math.abs(center - viewMid);
      const scale = minScale + this.smooth(1 - dist / (scroller.clientHeight * 0.75)) * (1 - minScale);
      img.style.transform = `scale(${scale})`;
    });
  }

  /** Titre / CTA / desc : projet dont l’image croise la ligne du texte. */
  private syncIndexFromCrossing(scroller: HTMLElement): void {
    const name = scroller.parentElement?.querySelector('.mobile-name');
    if (!name) {
      return;
    }
    const box = name.getBoundingClientRect();
    const line = box.top + box.height / 2;
    const slides = Array.from(scroller.querySelectorAll('.mobile-slide')) as HTMLElement[];
    let best = this.mobileCurrent();
    let bestCover = -1;
    slides.forEach((slide, i) => {
      const img = slide.querySelector('img');
      if (!img) {
        return;
      }
      const rect = img.getBoundingClientRect();
      if (rect.top < line && rect.bottom > line) {
        const cover = Math.min(rect.bottom, line + 1) - Math.max(rect.top, line - 1);
        if (cover > bestCover) {
          bestCover = cover;
          best = i;
        }
      }
    });
    this.setMobileIndex(best);
  }

  private setMobileIndex(index: number): void {
    if (index === this.mobileCurrent()) {
      return;
    }
    this.mobileCurrent.set(index);
    this.portfolio.select(index);
  }

  toggleAbout(): void {
    this.showAbout.update((value) => !value);
    if (!this.showAbout()) {
      this.mobileNeedsHome = true;
      this.mobileReady = false;
    }
  }

  openContact(): void {
    this.contactNotice.set('');
    this.contactOpen.set(true);
  }

  closeContact(): void {
    this.contactOpen.set(false);
  }

  onContactSubmit(event: Event): void {
    event.preventDefault();
    this.contactNotice.set(this.copy.contactDisabled);
  }
}
