import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
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
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  readonly i18n = inject(I18nService);
  readonly portfolio = inject(PortfolioService);

  readonly github = 'https://github.com/RaphaelMasset';
  readonly linkedin = 'https://www.linkedin.com/in/raphael-philippe-masset';

  readonly contactOpen = signal(false);
  readonly contactNotice = signal('');
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
  private snapTimer: number | null = null;
  private snapRaf = 0;
  private paintRaf = 0;
  private snapping = false;

  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartPos = 0;
  private dragged = false;

  // 150px d’image + 12px de gap = un cran d’index.
  private readonly slotPx = 162;
  private readonly basePx = 150;
  private readonly largePx = 320;

  @ViewChild('track') private track?: ElementRef<HTMLElement>;
  @ViewChildren('slideEl') private slideEls?: QueryList<ElementRef<HTMLElement>>;

  private onWheelBound = (event: WheelEvent) => this.onWheel(event);

  ngOnInit(): void {
    this.pos = this.portfolio.index();
    // runOutsideAngular : la molette ne doit PAS déclencher de change detection.
    // { passive: false } : obligatoire pour preventDefault (sinon la page scrolle).
    this.zone.runOutsideAngular(() => {
      window.addEventListener('wheel', this.onWheelBound, { passive: false });
    });
  }

  ngAfterViewInit(): void {
    this.paint();
  }

  ngOnDestroy(): void {
    window.removeEventListener('wheel', this.onWheelBound);
    this.clearSnap();
    if (this.paintRaf) {
      cancelAnimationFrame(this.paintRaf);
    }
  }

  get copy() {
    return this.i18n.copy();
  }

  get projects() {
    return this.portfolio.projects;
  }

  isMobile(): boolean {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  private onWheel(event: WheelEvent): void {
    if (this.isMobile() || this.contactOpen() || this.showAbout()) {
      return;
    }

    event.preventDefault();
    this.snapping = false;
    this.cancelRaf();

    // deltaMode : 0 = pixels (trackpad), 1 = lignes (molette crantée).
    // On ramène tout en “pixels” pour que les deux aient le même feeling.
    const pixels =
      event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
    this.pos = this.clamp(this.pos + pixels * 0.0044);
    this.schedulePaint();
    this.queueSnap();
  }

  /**
   * Plusieurs events molette arrivent dans la même frame (surtout trackpad).
   * On ne repeint qu’une fois par frame → 60 fps stables.
   */
  private schedulePaint(): void {
    if (this.paintRaf) {
      return;
    }
    this.paintRaf = requestAnimationFrame(() => {
      this.paintRaf = 0;
      this.paint();
    });
  }

  /**
   * transform uniquement (translate + scale). Changer width/height forcerait
   * le navigateur à recalculer le layout → saccades.
   */
  private paint(): void {
    const track = this.track?.nativeElement;
    const slides = this.slideEls;
    if (!track || !slides) {
      return;
    }

    track.style.transform = `translate3d(${-this.pos * this.slotPx}px, 0, 0)`;

    const maxScale = this.largePx / this.basePx;
    slides.forEach((ref, i) => {
      const t = Math.max(0, 1 - Math.abs(this.pos - i));
      const scale = 1 + t * (maxScale - 1);
      const el = ref.nativeElement;
      el.style.transform = `scale(${scale})`;
      el.style.zIndex = String(Math.round(t * 10));
    });

    const rounded = Math.round(this.pos);
    if (rounded !== this.portfolio.index()) {
      this.zone.run(() => this.portfolio.select(rounded));
    }
  }

  /** 120 ms sans molette = l’utilisateur s’est arrêté → on aligne une image. */
  private queueSnap(): void {
    if (this.snapTimer !== null) {
      window.clearTimeout(this.snapTimer);
    }
    this.snapTimer = window.setTimeout(() => this.snapToNearest(), 120);
  }

  private snapToNearest(): void {
    const target = Math.round(this.clamp(this.pos));
    this.animateTo(target);
  }

  /** easeOutQuart : ça continue un peu puis se cale, pas un arrêt au milieu. */
  private animateTo(target: number): void {
    this.snapping = true;
    const start = this.pos;
    const distance = target - start;
    if (Math.abs(distance) < 0.001) {
      this.pos = target;
      this.paint();
      this.snapping = false;
      return;
    }

    const duration = 380;
    const startedAt = performance.now();

    const tick = (now: number) => {
      if (!this.snapping) {
        return;
      }
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      this.pos = start + distance * eased;
      this.paint();
      if (t < 1) {
        this.snapRaf = requestAnimationFrame(tick);
      } else {
        this.pos = target;
        this.paint();
        this.snapping = false;
      }
    };

    this.cancelRaf();
    this.zone.runOutsideAngular(() => {
      this.snapRaf = requestAnimationFrame(tick);
    });
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(this.projects.length - 1, value));
  }

  private clearSnap(): void {
    if (this.snapTimer !== null) {
      window.clearTimeout(this.snapTimer);
      this.snapTimer = null;
    }
    this.cancelRaf();
    this.snapping = false;
  }

  private cancelRaf(): void {
    if (this.snapRaf) {
      cancelAnimationFrame(this.snapRaf);
      this.snapRaf = 0;
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (this.isMobile()) {
      return;
    }
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartPos = this.pos;
    this.dragged = false;
    this.snapping = false;
    this.cancelRaf();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - this.dragStartX;
    if (Math.abs(dx) > 8) {
      this.dragged = true;
    }
    this.pos = this.clamp(this.dragStartPos - dx / this.slotPx);
    this.schedulePaint();
  }

  onPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    this.dragPointerId = null;
    this.queueSnap();
  }

  openProject(index: number, event?: Event): void {
    if (this.dragged) {
      this.dragged = false;
      event?.preventDefault();
      return;
    }
    this.pos = index;
    this.paint();
    this.portfolio.select(index);
    void this.router.navigate(['/project', this.projects[index].slug]);
  }

  onMobileScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const slides = el.querySelectorAll('.mobile-slide');
    const mid = el.scrollTop + el.clientHeight * 0.45;
    let best = 0;
    slides.forEach((node, i) => {
      const slide = node as HTMLElement;
      if (slide.offsetTop <= mid) {
        best = i;
      }
    });
    this.portfolio.select(best);
  }

  toggleAbout(): void {
    this.showAbout.update((value) => !value);
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
