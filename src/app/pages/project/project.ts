import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-project-page',
  templateUrl: './project.html',
  styleUrl: './project.css'
})
export class ProjectPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly portfolio = inject(PortfolioService);

  readonly project = this.portfolio.bySlug(this.route.snapshot.paramMap.get('slug') ?? '');

  get copy() {
    return this.i18n.copy();
  }

  back(): void {
    void this.router.navigateByUrl('/');
  }
}
