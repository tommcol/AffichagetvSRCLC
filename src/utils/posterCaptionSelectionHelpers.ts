import { MatchItem } from '../types';

export const getPosterItemKey = (
  item: Partial<MatchItem> & Record<string, any>,
  index: number
): string => {
  if (item.id) return String(item.id);
  return `${item.category || 'cat'}-${item.teamHome || 'home'}-${item.teamAway || 'away'}-${index}`;
};

export const filterCaptionItems = <T extends Partial<MatchItem> & Record<string, any>>(
  items: T[],
  selectedItemKeysForCaption: string[] | null
): T[] => {
  if (selectedItemKeysForCaption === null) return items;
  return items.filter((item, idx) => {
    const k = getPosterItemKey(item, idx);
    return selectedItemKeysForCaption.includes(k);
  });
};

export const toggleCaptionItemSelection = (
  key: string,
  allKeys: string[],
  selectedItemKeysForCaption: string[] | null
): string[] | null => {
  if (selectedItemKeysForCaption === null) {
    return allKeys.filter((k) => k !== key);
  }

  if (selectedItemKeysForCaption.includes(key)) {
    return selectedItemKeysForCaption.filter((k) => k !== key);
  }

  const next = [...selectedItemKeysForCaption, key];

  if (next.length >= allKeys.length) {
    return null;
  }

  return next;
};
