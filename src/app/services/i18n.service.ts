import { Injectable, computed, signal } from '@angular/core';

export type Lang = 'fr' | 'en';

const COPY = {
  fr: {
    name: 'Raphaël Masset',
    role1: 'Ingénieur',
    role2: 'Développeur',
    role3: 'Data Analyst',
    servicesLabel: 'Services',
    services: 'Analyse, Development',
    availableLabel: 'Disponible',
    available: "Octobre '26",
    contact: 'Contact',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    scroll: 'Scroll',
    coverLetter:
      'Ingénieur développeur et data analyst, je construis des outils utiles — cartes, interfaces, et petits systèmes qui tiennent la route. Lettre courte pour l’instant, texte définitif plus tard.',
    contactTitle: 'Me contacter',
    contactName: 'Nom',
    contactEmail: 'Email',
    contactMessage: 'Message',
    contactSend: 'Envoyer',
    contactClose: 'Fermer',
    contactDisabled: "L’envoi d’email n’est pas encore branché (voir TODO.md).",
    back: 'Retour',
    placeholderLead: 'Page projet — démo à venir.',
    viewProject: 'Voir le projet',
    work: 'Projets',
    about: 'À propos'
  },
  en: {
    name: 'Raphaël Masset',
    role1: 'Engineer',
    role2: 'Developer',
    role3: 'Data Analyst',
    servicesLabel: 'Services',
    services: 'Analysis, Development',
    availableLabel: 'Available for work',
    available: "October '26",
    contact: 'Contact',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    scroll: 'Scroll',
    coverLetter:
      'Engineer, developer and data analyst. I build useful tools — maps, interfaces, and small systems that hold up. Short letter for now, final text later.',
    contactTitle: 'Contact me',
    contactName: 'Name',
    contactEmail: 'Email',
    contactMessage: 'Message',
    contactSend: 'Send',
    contactClose: 'Close',
    contactDisabled: 'Email sending is not wired yet (see TODO.md).',
    back: 'Back',
    placeholderLead: 'Project page — demo coming soon.',
    viewProject: 'View project',
    work: 'Work',
    about: 'About'
  }
} as const;

export type CopyKey = keyof typeof COPY.fr;

@Injectable({ providedIn: 'root' })
export class I18nService {
  // signal() = valeur réactive. Quand elle change, Angular met à jour
  // uniquement les templates qui la lisent. Pas besoin de this.cdr.detectChanges().
  readonly lang = signal<Lang>('fr');

  readonly copy = computed(() => COPY[this.lang()]);

  toggle(): void {
    this.lang.update((current) => (current === 'fr' ? 'en' : 'fr'));
  }

  set(lang: Lang): void {
    this.lang.set(lang);
  }
}
