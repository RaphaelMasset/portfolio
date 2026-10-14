import { Injectable, computed, signal } from '@angular/core';
import { PROJECTS } from '../data/projects';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  readonly projects = PROJECTS;
  readonly index = signal(0);

  constructor(private readonly i18n: I18nService) {}

  readonly current = computed(() => this.projects[this.index()]);

  readonly counter = computed(() => {
    const n = String(this.index() + 1).padStart(2, '0');
    const total = String(this.projects.length).padStart(2, '0');
    return `${n}/${total}`;
  });

  select(index: number): void {
    const last = this.projects.length - 1;
    const next = Math.max(0, Math.min(last, index));
    // Évite un cycle de détection Angular si on est déjà sur cette image
    // (le scroll mobile envoie des dizaines d’events par geste).
    if (next === this.index()) {
      return;
    }
    this.index.set(next);
  }

  title(): string {
    return this.current().title[this.i18n.lang()];
  }

  description(): string {
    return this.current().description[this.i18n.lang()];
  }

  bySlug(slug: string) {
    return this.projects.find((project) => project.slug === slug);
  }
}
