import { isCarouselSlideVideo } from '../src/utils/carouselVideoHelpers';

const themes = {
  birthdays: {},
  matches: { backgroundUrl: '/uploads/match.mp4' },
  results: {},
} as any;

const visualTemplates = {} as any;

const matchSlide = {
  id: 'matches',
  type: 'category',
  categoryId: 'matches',
  durationSeconds: 6,
} as any;

if (!isCarouselSlideVideo(matchSlide, themes, [], visualTemplates)) {
  throw new Error('theme video detection failed');
}

const photoSlide = {
  id: 'photo',
  type: 'category',
  categoryId: 'photos',
  photo: { imageUrl: '/uploads/photo.mp4' },
} as any;

if (!isCarouselSlideVideo(photoSlide, themes, [], visualTemplates)) {
  throw new Error('photo video detection failed');
}

console.log('carousel video helpers: 2/2 OK');
