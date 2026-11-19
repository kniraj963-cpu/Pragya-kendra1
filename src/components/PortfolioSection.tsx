import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Plus, Search, Trash2, X } from 'lucide-react';
import type { ProjectMetadata } from '../data/catalog.ts';
import { apiUrl } from '../utils/fileReader.ts';

interface PortfolioSectionProps {
  lang: 'en' | 'hi';
  projects: ProjectMetadata[];
  loading: boolean;
  staffAuthenticated: boolean;
  staffToken: string | null;
  onRequestStaffAuth: () => void;
  onRefreshProjects: () => Promise<void>;
  onInquireAboutProject: (project: ProjectMetadata) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PORTFOLIO_CATEGORIES = [
  'All',
  'Land & Anchal',
  'Registry & Legal',
  'JharSewa Certificates',
  'Business & GST',
  'DTO & Transport',
  'Digital & Web',
];

function ProjectVisualBanner({ project, large = false }: { project: ProjectMetadata; large?: boolean }) {
  const palette: Record<ProjectMetadata['visualTheme'], string> = {
    navy: 'from-slate-900 via-slate-800 to-blue-950 text-amber-300',
    amber: 'from-amber-950 via-slate-900 to-slate-950 text-amber-300',
    emerald: 'from-emerald-950 via-slate-900 to-slate-950 text-emerald-300',
    slate: 'from-slate-800 via-slate-900 to-slate-950 text-slate-200',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${palette[project.visualTheme] || palette.navy} ${
        large ? 'h-56 sm:h-64' : 'h-40'
      } p-5 flex flex-col justify-between border border-slate-800/40`}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`grid-${project._id}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${project._id})`} />
      </svg>

      <div className="relative z-10 flex items-center justify-between text-xs font-mono opacity-85">
        <span>{project.location}</span>
        <span className="tabular-nums">{project.year}</span>
      </div>

      <div className="relative z-10 space-y-1">
        <p className="text-xs font-medium text-white/75">{project.clientSector}</p>
        <p className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
          {project.outcomeMetric}
        </p>
      </div>
    </div>
  );
}

export function PortfolioSection({
  lang,
  projects,
  loading,
  staffAuthenticated,
  staffToken,
  onRequestStaffAuth,
  onRefreshProjects,
  onInquireAboutProject,
  onNotify,
}: PortfolioSectionProps) {
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectMetadata | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Land & Anchal');
  const [newSector, setNewSector] = useState('');
  const [newLocation, setNewLocation] = useState('Kutchery Chowk, Ranchi');
  const [newTurnaround, setNewTurnaround] = useState('5 Working Days');
  const [newOutcome, setNewOutcome] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newDeliverables, setNewDeliverables] = useState('');
  const [newFeatured, setNewFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filtered = projects.filter((p) => {
    const catOk = activeCat === 'All' || p.category === activeCat;
    const q = search.toLowerCase().trim();
    const qOk =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.titleHi.includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.clientSector.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return catOk && qOk;
  });

  const authHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (staffToken) h.Authorization = `Bearer ${staffToken}`;
    return h;
  };

  const handleOpenAddModal = () => {
    if (!staffAuthenticated) {
      onRequestStaffAuth();
      onNotify('Staff PIN login required to add portfolio metadata.', 'info');
      return;
    }
    setShowAddModal(true);
  };

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const deliverables = newDeliverables
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(apiUrl('/api/projects'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          clientSector: newSector || 'Ranchi Client',
          location: newLocation,
          turnaround: newTurnaround,
          outcomeMetric: newOutcome || 'Verified Delivery',
          summary: newSummary,
          deliverables,
          tags: [newCategory, 'Ranchi'],
          featured: newFeatured,
          visualTheme: 'navy',
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || 'Failed to save project metadata');
      }
      await onRefreshProjects();
      setShowAddModal(false);
      setNewTitle('');
      setNewSector('');
      setNewOutcome('');
      setNewSummary('');
      setNewDeliverables('');
      setNewFeatured(false);
      onNotify('Project metadata saved to MongoDB.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!staffAuthenticated) {
      onRequestStaffAuth();
      onNotify('Staff login required to remove project records.', 'info');
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/projects/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Could not delete project');
      await onRefreshProjects();
      setSelectedProject(null);
      onNotify('Project removed from MongoDB.', 'info');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  return (
    <section
      id="portfolio"
      className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {lang === 'hi' ? 'सफल केस स्टडी एवं प्रोजेक्ट संग्रह' : 'Selected Case Studies & Project Metadata'}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {lang === 'hi' ? 'प्रज्ञा केंद्र डिलीवरी पोर्टफोलियो' : 'Delivered Land, Registry & Digital Projects'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{lang === 'hi' ? 'नया प्रोजेक्ट जोड़ें' : 'Add Project Metadata'}</span>
          </button>
        </div>

        {/* Filter Bar + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl">
            {PORTFOLIO_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeCat === cat
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'hi' ? 'प्रोजेक्ट खोजें...' : 'Filter case studies...'}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Bento Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-slate-200/60 dark:bg-slate-900 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-500">
            No matching project metadata found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((project, index) => {
              const isFeaturedCard = index === 0 && activeCat === 'All' && !search;
              return (
                <article
                  key={project._id}
                  onClick={() => setSelectedProject(project)}
                  className={`group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors ${
                    isFeaturedCard ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <ProjectVisualBanner project={project} large={isFeaturedCard} />

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">{project.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{project.turnaround}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{project.year}</span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-lg sm:text-xl text-slate-950 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug">
                        {lang === 'hi' ? project.titleHi : project.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {project.summary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[70%]">
                      {project.tags.join(' · ')}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1 shrink-0">
                      {lang === 'hi' ? 'विवरण' : 'Inspect'}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Lightbox */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">{selectedProject.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedProject.location}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedProject.turnaround}</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
                  {lang === 'hi' ? selectedProject.titleHi : selectedProject.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project details"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ProjectVisualBanner project={selectedProject} large />

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedProject.summary}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Key Deliverables</h4>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                {selectedProject.deliverables.map((d) => (
                  <li
                    key={d}
                    className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {staffAuthenticated ? (
                <button
                  type="button"
                  onClick={() => handleDeleteProject(selectedProject._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Record</span>
                </button>
              ) : (
                <span className="text-xs text-slate-500">Staff PIN required for edits</span>
              )}

              <button
                type="button"
                onClick={() => {
                  const proj = selectedProject;
                  setSelectedProject(null);
                  onInquireAboutProject(proj);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl transition-colors cursor-pointer"
              >
                Request Similar Service →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Add Portfolio Project Metadata
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Namkum Anchal Register-II Mutation & LPC"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {PORTFOLIO_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turnaround Time
                  </label>
                  <input
                    type="text"
                    value={newTurnaround}
                    onChange={(e) => setNewTurnaround(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client Sector
                  </label>
                  <input
                    type="text"
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    placeholder="e.g., Commercial Property Owners"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Outcome Metric
                  </label>
                  <input
                    type="text"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    placeholder="e.g., 100% First-Pass Approval"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deliverables (comma-separated)
                </label>
                <input
                  type="text"
                  value={newDeliverables}
                  onChange={(e) => setNewDeliverables(e.target.value)}
                  placeholder="Chain Deed Scrutiny, Online Lagan Rasid, Mutation Slip"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFeatured}
                  onChange={(e) => setNewFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-slate-900"
                />
                <span>Feature as lead portfolio case study</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
