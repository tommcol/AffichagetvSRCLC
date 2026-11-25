import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { BirthdayItem, ClubSettings, VisualTemplatesConfig } from '../../../types';
import { safeExportPosterToDataUrl } from '../../../utils/posterExporter';
import { getEffectiveCategoryConfig } from '../../../utils/themeUtils';
import { FixedCanvas169 } from '../../common/FixedCanvas169';
import { BirthdaysSlide } from '../../slides/BirthdaysSlide';

interface BirthdayImageDownloadProps {
  birthdays: BirthdayItem[];
  clubSettings: ClubSettings;
  visualTemplates: VisualTemplatesConfig;
  weekKey: string;
}

const BIRTHDAYS_PER_IMAGE = 12;

export function BirthdayImageDownload({ birthdays, clubSettings, visualTemplates, weekKey }: BirthdayImageDownloadProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const totalPages = Math.ceil(birthdays.length / BIRTHDAYS_PER_IMAGE);
  const page = Math.min(selectedPage, Math.max(0, totalPages - 1));
  const firstBirthday = page * BIRTHDAYS_PER_IMAGE;
  const design = getEffectiveCategoryConfig('birthdays', visualTemplates, clubSettings);

  async function downloadImage() {
    if (!slideRef.current || isExporting) return;

    setError('');
    setIsExporting(true);
    try {
      const link = document.createElement('a');
      link.href = await safeExportPosterToDataUrl(slideRef.current, '16:9');
      const suffix = totalPages > 1 ? `-${page + 1}` : '';
      link.download = `anniversaires-${weekKey}${suffix}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de télécharger le visuel.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        disabled={!totalPages || isExporting}
        aria-expanded={Boolean(totalPages && showPreview)}
        className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-bold text-white hover:bg-pink-500 disabled:opacity-50"
      >
        {showPreview && totalPages ? 'Fermer l’aperçu' : 'Aperçu et téléchargement du visuel'}
      </button>
      {showPreview && totalPages > 0 && (
        <>
          <div className="aspect-video max-w-4xl overflow-hidden rounded-xl">
            <FixedCanvas169>
              <div ref={slideRef} className="h-full w-full">
                <BirthdaysSlide
                  birthdays={birthdays.slice(firstBirthday, firstBirthday + BIRTHDAYS_PER_IMAGE)}
                  clubSettings={clubSettings}
                  backgroundUrl={design.backgroundUrl}
                  theme={design.theme}
                  mascot={design.mascot}
                  layer3={design.layer3}
                  layer4={design.layer4}
                  forImageExport
                />
              </div>
            </FixedCanvas169>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {totalPages > 1 && (
              <label className="flex items-center gap-2 text-sm text-slate-200">
                Image
                <select
                  value={page}
                  onChange={event => { setSelectedPage(Number(event.target.value)); setError(''); }}
                  disabled={isExporting}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5"
                >
                  {Array.from({ length: totalPages }, (_, index) => (
                    <option key={index} value={index}>{index + 1} sur {totalPages}</option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={downloadImage}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-bold text-white hover:bg-pink-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Préparation de l’image…' : 'Télécharger le visuel (PNG)'}
            </button>
          </div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        </>
      )}
    </div>
  );
}
