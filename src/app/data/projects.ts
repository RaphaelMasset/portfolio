export interface Project {
  slug: string;
  image: string;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
}

export const PROJECTS: Project[] = [
  {
    slug: 'real-estate',
    image: 'assets/projects/01-real-estate.jpg',
    title: {
      fr: 'Immobilier & machine learning',
      en: 'Machine learning for real estate'
    },
    description: {
      fr: 'Carte de biens vendu, avec un code couleur selon qu’ils sont trop chers ou non.',
      en: 'Map of sold listings, color-coded by whether they look overpriced.'
    }
  },
  {
    slug: 'mind-map',
    image: 'assets/projects/02-mind-map.jpg',
    title: {
      fr: 'Universal Mind Mapping',
      en: 'Universal Mind Mapping'
    },
    description: {
      fr: 'Outil de mind mapping.',
      en: 'A mind-mapping tool.'
    }
  },
  {
    slug: 'ai-coach',
    image: 'assets/projects/03-ai-coach.jpg',
    title: {
      fr: 'Encyclopédie sportive & chatbot',
      en: 'Sports encyclopedia & chatbot'
    },
    description: {
      fr: '',
      en: ''
    }
  },
  {
    slug: 'extra-4',
    image: 'assets/projects/04-extra.jpg',
    title: {
      fr: 'Projet à venir',
      en: 'Upcoming project'
    },
    description: {
      fr: '',
      en: ''
    }
  },
  {
    slug: 'extra-5',
    image: 'assets/projects/05-extra.jpg',
    title: {
      fr: 'Projet à venir',
      en: 'Upcoming project'
    },
    description: {
      fr: '',
      en: ''
    }
  }
];
