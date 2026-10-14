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
      fr: 'Carte de biens en vente, avec un code couleur selon qu’ils sont trop chers ou non. La carte arrive plus tard — cette page est le contenant du portfolio.',
      en: 'A map of listings, color-coded by whether they look overpriced. The map comes later — this page is the portfolio shell.'
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
      fr: 'Outil de mind mapping. La description détaillée arrivera plus tard.',
      en: 'A mind-mapping tool. The detailed description will come later.'
    }
  },
  {
    slug: 'ai-coach',
    image: 'assets/projects/03-ai-coach.jpg',
    title: {
      fr: 'IA coach : encyclopédie sport & chatbot',
      en: 'AI coach: strength training chatbot'
    },
    description: {
      fr: 'Encyclopédie de sport avec un chatbot. La description détaillée arrivera plus tard.',
      en: 'A sports encyclopedia with a chatbot. The detailed description will come later.'
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
      fr: 'Visuel placeholder n°4 du carrousel. Tu pourras le remplacer plus tard.',
      en: 'Carousel placeholder #4. You can replace it later.'
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
      fr: 'Visuel placeholder n°5 du carrousel. Tu pourras le remplacer plus tard.',
      en: 'Carousel placeholder #5. You can replace it later.'
    }
  }
];
