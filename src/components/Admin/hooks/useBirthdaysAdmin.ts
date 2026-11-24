import React, { useState, useRef, useEffect } from 'react';
import { BirthdayItem } from '../../../types';
import { clubCalendarDate } from '../../../utils/clubTime';
import {
  parseExcelBirthdays,
  getWeekBounds,
  filterAndSortBirthdaysForWeek,
  formatFrenchBirthday,
  sortBirthdaysByHierarchy,
  formatDisplayCategory,
} from '../../../utils/excelBirthdayParser';

// Code déplacé tel quel depuis AdminPanel.tsx, sans changement de comportement.
interface UseBirthdaysAdminParams {
  birthdays: BirthdayItem[];
  onUpdateBirthdays: (newBirthdays: BirthdayItem[]) => void;
  allMembers: BirthdayItem[] | undefined;
  onUpdateAllMembers: ((newMembers: BirthdayItem[], weekBirthdays?: BirthdayItem[]) => void) | undefined;
  simulatedDate: Date | null | undefined;
}

export function useBirthdaysAdmin({ birthdays, onUpdateBirthdays, allMembers, onUpdateAllMembers, simulatedDate }: UseBirthdaysAdminParams) {
  // Excel & Birthday parsing/editing state
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState<string | null>(null);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);
  const [birthdayWeekOffset, setBirthdayWeekOffset] = useState<number>(0);
  const [allMembersPool, setAllMembersPool] = useState<BirthdayItem[]>(() => {
    if (Array.isArray(allMembers)) return allMembers;
    try {
      const saved = localStorage.getItem('club_all_members_pool');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (Array.isArray(allMembers)) {
      setAllMembersPool(allMembers);
    }
  }, [allMembers]);

  // Synchronisation unifiée de la liste complète des adhérents (source de vérité unique)
  const updateAllMembersEverywhere = (newPool: BirthdayItem[], newWeekBirthdays?: BirthdayItem[]) => {
    setAllMembersPool(newPool);
    onUpdateAllMembers?.(newPool, newWeekBirthdays);
    if (newWeekBirthdays !== undefined) {
      onUpdateBirthdays(newWeekBirthdays);
    }
    try {
      localStorage.setItem('club_all_members_pool', JSON.stringify(newPool));
    } catch (e) {}
  };
  const [editingBirthdayId, setEditingBirthdayId] = useState<string | null>(null);
  const [editBdayFirstName, setEditBdayFirstName] = useState<string>('');
  const [editBdayCategory, setEditBdayCategory] = useState<string>('');
  const [editBdayDate, setEditBdayDate] = useState<string>('');

  // Adding manual birthday
  const [isAddingManualBday, setIsAddingManualBday] = useState<boolean>(false);
  const [manualBdayFirstName, setManualBdayFirstName] = useState<string>('');
  const [manualBdayCategory, setManualBdayCategory] = useState<string>('U15');
  const [manualBdayDate, setManualBdayDate] = useState<string>('');

  // Excel upload handler & Birthday week handlers
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setExcelSuccessMsg(null);
    setExcelErrors([]);

    try {
      const result = await parseExcelBirthdays(file, new Date(), birthdayWeekOffset);
      if (result.allMembers && result.allMembers.length > 0) {
        const sortedMembers = sortBirthdaysByHierarchy(result.allMembers);
        const refDate = simulatedDate || clubCalendarDate();
        const filtered = filterAndSortBirthdaysForWeek(sortedMembers, refDate, birthdayWeekOffset);
        updateAllMembersEverywhere(sortedMembers, filtered);

        const bounds = getWeekBounds(refDate, birthdayWeekOffset);
        setExcelSuccessMsg(
          `Fichier ${file.name} importé avec succès (${sortedMembers.length} licenciés trouvés). ${filtered.length} anniversaire(s) sélectionné(s) pour la ${bounds.shortLabel} !`
        );
      } else if (result.errors && result.errors.length > 0) {
        setExcelErrors(result.errors);
      } else {
        setExcelErrors(['Aucun licencié trouvé dans ce fichier']);
      }
    } catch (err: any) {
      console.error(err);
      setExcelErrors([err.message || 'Erreur inattendue lors du traitement du fichier Excel']);
    } finally {
      setIsParsingExcel(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleSelectWeekOffset = (offset: number) => { setShowAllBirthdays(false); setBirthdayWeekOffset(offset); };

  const handleStartEditBirthday = (item: BirthdayItem) => {
    setEditingBirthdayId(item.id);
    const firstName = item.firstName || (item.fullName ? item.fullName.trim().split(/\s+/)[0] : '');
    setEditBdayFirstName(firstName);
    setEditBdayCategory(item.teamCategory || '');
    setEditBdayDate(item.birthDate || '');
  };

  const handleSaveEditBirthday = (id: string) => {
    const cleanFirst = editBdayFirstName.trim();
    if (!cleanFirst) return;
    const cleanCat = formatDisplayCategory(editBdayCategory.trim() || 'Club', undefined, cleanFirst);

    const updateList = (list: BirthdayItem[]) =>
      list.map((b) => {
        if (b.id !== id) return b;
        let newFormatted = b.birthDayFormatted;
        if (editBdayDate) {
          const d = new Date(editBdayDate);
          if (!isNaN(d.getTime())) {
            newFormatted = formatFrenchBirthday(d);
          }
        }
        return {
          ...b,
          firstName: cleanFirst,
          fullName: cleanFirst,
          teamCategory: cleanCat,
          birthDate: editBdayDate || b.birthDate,
          birthDayFormatted: newFormatted,
        };
      });

    const updatedBirthdays = sortBirthdaysByHierarchy(updateList(birthdays));
    const pool = (allMembers && allMembers.length > 0) ? allMembers : allMembersPool;
    const updatedPool = pool.length > 0 ? sortBirthdaysByHierarchy(updateList(pool)) : updatedBirthdays;
    updateAllMembersEverywhere(updatedPool, updatedBirthdays);

    setEditingBirthdayId(null);
  };

  const handleCancelEditBirthday = () => {
    setEditingBirthdayId(null);
  };

  const handleAddManualBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBdayFirstName.trim()) return;

    const cleanFirst = manualBdayFirstName.trim();
    const cleanCat = formatDisplayCategory(manualBdayCategory.trim() || 'Club', undefined, cleanFirst);
    const dateObj = manualBdayDate ? new Date(manualBdayDate) : new Date();
    const formattedDate = formatFrenchBirthday(dateObj);

    const newItem: BirthdayItem = {
      id: `bday-manual-${Date.now()}`,
      firstName: cleanFirst,
      fullName: cleanFirst,
      teamCategory: cleanCat,
      birthDate: manualBdayDate || new Date().toISOString().split('T')[0],
      birthDayFormatted: formattedDate,
      isThisWeek: true,
    };

    const nextList = sortBirthdaysByHierarchy([newItem, ...birthdays]);
    const pool = (allMembers && allMembers.length > 0) ? allMembers : allMembersPool;
    const nextPool = sortBirthdaysByHierarchy([newItem, ...pool]);
    updateAllMembersEverywhere(nextPool, nextList);

    setManualBdayFirstName('');
    setManualBdayCategory('U15');
    setManualBdayDate('');
    setIsAddingManualBday(false);
  };

  const handleDeleteBirthday = (id: string) => {
    const nextList = birthdays.filter((b) => b.id !== id);
    const pool = (allMembers && allMembers.length > 0) ? allMembers : allMembersPool;
    const nextPool = pool.length > 0 ? pool.filter((b) => b.id !== id) : [];
    updateAllMembersEverywhere(nextPool, nextList);
  };

  return {
    isParsingExcel,
    excelSuccessMsg,
    excelErrors,
    excelInputRef,
    showAllBirthdays,
    setShowAllBirthdays,
    birthdayWeekOffset,
    allMembersPool,
    editingBirthdayId,
    editBdayFirstName,
    setEditBdayFirstName,
    editBdayCategory,
    setEditBdayCategory,
    editBdayDate,
    setEditBdayDate,
    isAddingManualBday,
    setIsAddingManualBday,
    manualBdayFirstName,
    setManualBdayFirstName,
    manualBdayCategory,
    setManualBdayCategory,
    manualBdayDate,
    setManualBdayDate,
    handleExcelFileUpload,
    handleSelectWeekOffset,
    handleStartEditBirthday,
    handleSaveEditBirthday,
    handleCancelEditBirthday,
    handleAddManualBirthday,
    handleDeleteBirthday,
  };
}
