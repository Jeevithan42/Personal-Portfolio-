
(function () {
      // ---------- data ----------
      // Edit this array to add/change projects. See the notes at the top
      // of project_showcase.txt for what each field does.
      const PROJECT_DATA = [
            {
                  id: 'snake-game',
                  order: 1,
                  title: 'Snake Game',
                  emoji: '🐍',
                  color: 'lime',
                  category: 'game',
                  categoryLabel: 'Game',
                  status: 'complete',
                  statusLabel: 'Complete',
                  dateLabel: 'Personal project',
                  shortDescription:
                        'A classic Snake game built in Python using Pygame. Navigate the snake, eat food, grow longer.',
                  longDescription: [
                        'A classic Snake game built in Python using Pygame. Navigate the snake, eat food, and grow longer while avoiding the walls and your own tail.',
                        'Built as a from-scratch exercise in game loops, collision detection, and keyboard input handling — the fundamentals that show up in every larger game project.',
                  ],
                  techStack: ['Python', 'Pygame'],
                  sourceUrl: null,
                  demoUrl: null,
                  video: null,
                  videoNote: 'No walkthrough recorded yet — check back soon.',
                  photos: [
                        { label: 'Gameplay', color: 'lime' },
                        { label: 'Game Over Screen', color: 'yellow' },
                        { label: 'Score Display', color: 'cyan' },
                  ],
            },
            {
                  id: 'portfolio-website',
                  order: 2,
                  title: 'Portfolio Website',
                  emoji: '📓',
                  color: 'pink',
                  category: 'web',
                  categoryLabel: 'Web',
                  status: 'complete',
                  statusLabel: 'Complete',
                  dateLabel: 'Personal project',
                  shortDescription:
                        'This portfolio site! Built with pure HTML, CSS, and JavaScript. Features a basketball mini-game.',
                  longDescription: [
                        'This portfolio site! Built from scratch with plain HTML, CSS, and JavaScript — no framework, no build step.',
                        'Includes a notebook-paper visual theme, a physics-based basketball mini-game, an interactive photo gallery, and this very project showcase.',
                  ],
                  techStack: ['HTML', 'CSS', 'JavaScript'],
                  sourceUrl: null,
                  demoUrl: null,
                  video: null,
                  videoNote: 'No walkthrough recorded yet — check back soon.',
                  photos: [
                        { label: 'Home Page', color: 'pink' },
                        { label: 'Basketball Game', color: 'orange' },
                        { label: 'Gallery Page', color: 'purple' },
                  ],
            },
            {
                  id: 'cli-portfolio-maker',
                  order: 3,
                  title: 'CLI Portfolio Maker',
                  emoji: '⌨️',
                  color: 'cyan',
                  category: 'tool',
                  categoryLabel: 'Tool',
                  status: 'complete',
                  statusLabel: 'Complete',
                  dateLabel: 'Personal project',
                  shortDescription: 'A command-line tool to scaffold portfolio websites quickly.',
                  longDescription: [
                        'A command-line tool to scaffold portfolio websites quickly — answer a few prompts and get a ready-to-edit site.',
                        'Built to remove the repetitive setup work every new portfolio project starts with.',
                  ],
                  techStack: ['Python', 'CLI'],
                  sourceUrl: null,
                  demoUrl: null,
                  video: null,
                  videoNote: 'No walkthrough recorded yet — check back soon.',
                  photos: [
                        { label: 'Terminal Prompt', color: 'cyan' },
                        { label: 'Generated Site', color: 'lime' },
                  ],
            },
            {
                  id: 'coming-soon',
                  order: 4,
                  title: 'Placeholder Project',
                  emoji: '🚧',
                  color: 'orange',
                  category: 'misc',
                  categoryLabel: 'Misc',
                  status: 'planned',
                  statusLabel: 'Planned',
                  dateLabel: 'Coming soon',
                  shortDescription: 'Coming soon. Working on something cool.',
                  longDescription: [
                        'Coming soon. Working on something cool — details land here once the project is further along.',
                  ],
                  techStack: [],
                  sourceUrl: null,
                  demoUrl: null,
                  video: null,
                  videoNote: 'Nothing to show yet.',
                  photos: [],
            },
      ];

      // ---------- tiny utilities ----------

      // deterministic pseudo-random in [0,1) — stable across re-renders,
      // used only for picking which corner decoration each card gets.
      function seeded(n) {
            const x = Math.sin(n * 999.99) * 10000;
            return x - Math.floor(x);
      }

      // classic trailing debounce: waits `wait` ms of silence before firing
      function debounce(fn, wait) {
            let timer;
            return function debounced(...args) {
                  clearTimeout(timer);
                  timer = setTimeout(() => fn.apply(this, args), wait);
            };
      }

      // localStorage wrapper: namespaced, JSON-aware, never throws
      const STORAGE_PREFIX = 'jm-proj:';
      const Storage = {
            get(key, fallback) {
                  try {
                        const raw = localStorage.getItem(STORAGE_PREFIX + key);
                        return raw === null ? fallback : JSON.parse(raw);
                  } catch (err) {
                        return fallback;
                  }
            },
            set(key, value) {
                  try {
                        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
                  } catch (err) {
                        // localStorage unavailable (private browsing, quota, etc.) — ignore
                  }
            },
      };

      // minimal pub/sub so the toolbar, grid, and stats line don't need to
      // call each other directly — they just react to "showcase:changed"
      const EventBus = (function () {
            const listeners = {};
            return {
                  on(evt, fn) {
                        (listeners[evt] || (listeners[evt] = [])).push(fn);
                  },
                  off(evt, fn) {
                        if (!listeners[evt]) return;
                        listeners[evt] = listeners[evt].filter((f) => f !== fn);
                  },
                  emit(evt, payload) {
                        (listeners[evt] || []).forEach((fn) => fn(payload));
                  },
            };
      })();

      // ---------- toast notifications ----------
      const Toast = (function () {
            let stack;
            function ensureStack() {
                  if (stack) return stack;
                  stack = document.createElement('div');
                  stack.className = 'ps-toast-stack';
                  document.body.appendChild(stack);
                  return stack;
            }
            function show(message, type) {
                  const el = document.createElement('div');
                  el.className = 'ps-toast' + (type === 'success' ? ' ps-toast-success' : '');
                  el.textContent = message;
                  ensureStack().appendChild(el);
                  requestAnimationFrame(() => el.classList.add('ps-toast-in'));
                  setTimeout(() => {
                        el.classList.remove('ps-toast-in');
                        el.classList.add('ps-toast-out');
                        setTimeout(() => el.remove(), 300);
                  }, 3200);
            }
            return { show };
      })();

      // ---------- confetti (pure decoration) ----------
      const Confetti = (function () {
            const COLORS = ['#e0c3c4', '#b5c7cd', '#c7d1ab', '#dfbfa8', '#c9bbc9', '#eaddb6'];
            function burst(x, y) {
                  const layer = document.createElement('div');
                  layer.className = 'ps-confetti-layer';
                  document.body.appendChild(layer);
                  const count = 22;
                  for (let i = 0; i < count; i++) {
                        const piece = document.createElement('span');
                        piece.className = 'ps-confetti-piece';
                        const angle = seeded(i * 3.3) * Math.PI * 2;
                        const dist = 80 + seeded(i * 5.7) * 140;
                        piece.style.left = x + 'px';
                        piece.style.top = y + 'px';
                        piece.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
                        piece.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
                        piece.style.setProperty('--rot', Math.floor(seeded(i * 9.1) * 720 - 360) + 'deg');
                        piece.style.setProperty('--delay', (seeded(i * 1.9) * 0.15).toFixed(2) + 's');
                        piece.style.backgroundColor = COLORS[i % COLORS.length];
                        layer.appendChild(piece);
                  }
                  setTimeout(() => layer.remove(), 1300);
            }
            return { burst };
      })();

      // ---------- activity log ----------
      // Keeps an in-memory (not persisted) list of the last 30 things you
      // did on this page — searches, filters, favorites, project opens.
      // Purely a transparency/fun panel; nothing reads this data back and
      // nothing is sent anywhere.
      const ActivityLog = (function () {
            const entries = [];
            function log(message) {
                  entries.unshift({ message, time: new Date() });
                  if (entries.length > 30) entries.length = 30;
                  renderActivityPanel();
            }
            function clear() {
                  entries.length = 0;
                  renderActivityPanel();
            }
            function all() {
                  return entries;
            }
            return { log, clear, all };
      })();

      let activityPanelEl = null;

      function buildActivityPanel() {
            activityPanelEl = document.createElement('div');
            activityPanelEl.className = 'ps-activity-panel';
            activityPanelEl.innerHTML =
                  '<div class="ps-activity-header">' +
                  '<strong>Activity Log</strong>' +
                  '<div>' +
                  '<button type="button" class="ps-icon-btn ps-activity-clear" title="Clear log">🗑</button>' +
                  '<button type="button" class="ps-icon-btn ps-activity-close" title="Close">✕</button>' +
                  '</div></div>' +
                  '<ul class="ps-activity-list"></ul>';
            activityPanelEl
                  .querySelector('.ps-activity-clear')
                  .addEventListener('click', () => ActivityLog.clear());
            activityPanelEl
                  .querySelector('.ps-activity-close')
                  .addEventListener('click', toggleActivityPanel);
            document.body.appendChild(activityPanelEl);
      }

      // Redraws the log list. Called every time an entry is added, and
      // whenever the panel is (re)opened.
      function renderActivityPanel() {
            if (!activityPanelEl) return;
            const list = activityPanelEl.querySelector('.ps-activity-list');
            list.innerHTML = '';
            ActivityLog.all().forEach((entry) => {
                  const li = document.createElement('li');
                  li.textContent = entry.time.toLocaleTimeString() + ' — ' + entry.message;
                  list.appendChild(li);
            });
            if (!ActivityLog.all().length) {
                  const li = document.createElement('li');
                  li.className = 'ps-activity-empty';
                  li.textContent = 'Nothing logged yet — browse around.';
                  list.appendChild(li);
            }
      }

      function toggleActivityPanel() {
            if (!activityPanelEl) buildActivityPanel();
            activityPanelEl.classList.toggle('ps-open');
            if (activityPanelEl.classList.contains('ps-open')) renderActivityPanel();
      }

      // ---------- shared state ----------
      let toolbarState = {
            query: '',
            category: 'all',
            favoritesOnly: false,
            sort: 'newest',
            viewMode: 'grid',
      };

      let modalState = {
            project: null,
            tab: 'overview',
            photoIndex: 0,
      };

      let modalEl = null;
      let lastFocusedEl = null;
      let shortcutsEl = null;

      // ---------- boot ----------
      document.addEventListener('DOMContentLoaded', init);

      function init() {
            const mount = document.getElementById('project-showcase');
            if (!mount) return; // no-op on pages without the showcase

            injectStyles();
            mount.classList.add('ps-root');

            const prefs = Storage.get('toolbarPrefs', {});
            toolbarState = Object.assign(toolbarState, prefs);

            const toolbar = document.createElement('div');
            toolbar.className = 'ps-toolbar';
            mount.appendChild(toolbar);

            const grid = document.createElement('div');
            grid.className = 'ps-grid';
            mount.appendChild(grid);

            renderSkeleton(grid);
            renderToolbar(toolbar);

            // artificial delay so the skeleton shimmer is visible — the data
            // is already in memory, there's nothing real to wait for
            setTimeout(() => {
                  renderGrid(grid);
            }, 400);

            EventBus.on('showcase:changed', () => {
                  renderGrid(grid);
                  updateStats(toolbar);
            });

            document.addEventListener('keydown', handleGlobalKeydown);

            handleDeepLink();
            maybeRunSmokeTests();
      }

      // ---------- skeleton loader ----------
      function renderSkeleton(grid) {
            grid.innerHTML = '';
            for (let i = 0; i < 4; i++) {
                  const card = document.createElement('div');
                  card.className = 'ps-card ps-skeleton';
                  card.innerHTML =
                        '<div class="ps-skeleton-thumb"></div>' +
                        '<div class="ps-skeleton-line ps-skeleton-line-wide"></div>' +
                        '<div class="ps-skeleton-line"></div>' +
                        '<div class="ps-skeleton-line ps-skeleton-line-short"></div>';
                  grid.appendChild(card);
            }
      }

      // ---------- toolbar ----------
      function renderToolbar(toolbar) {
            toolbar.innerHTML = '';

            const searchWrap = document.createElement('div');
            searchWrap.className = 'ps-search-wrap';
            const searchInput = document.createElement('input');
            searchInput.type = 'search';
            searchInput.className = 'ps-search';
            searchInput.placeholder = 'Search projects... (press /)';
            searchInput.id = 'ps-search-input';
            searchInput.value = toolbarState.query;
            const debouncedSearch = debounce((value) => {
                  toolbarState.query = value;
                  if (value) ActivityLog.log('Searched for "' + value + '"');
                  EventBus.emit('showcase:changed');
            }, 200);
            searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
            searchWrap.appendChild(searchInput);
            toolbar.appendChild(searchWrap);

            const chipRow = document.createElement('div');
            chipRow.className = 'ps-chip-row';
            const categories = ['all', ...new Set(PROJECT_DATA.map((p) => p.category))];
            categories.forEach((cat) => {
                  const chip = document.createElement('button');
                  chip.type = 'button';
                  chip.className = 'ps-chip' + (toolbarState.category === cat ? ' ps-chip-active' : '');
                  chip.textContent = cat === 'all' ? 'All' : labelForCategory(cat);
                  chip.addEventListener('click', () => {
                        toolbarState.category = cat;
                        persistPrefs();
                        ActivityLog.log('Filtered to category: ' + (cat === 'all' ? 'All' : labelForCategory(cat)));
                        renderToolbar(toolbar);
                        EventBus.emit('showcase:changed');
                  });
                  chipRow.appendChild(chip);
            });

            const favChip = document.createElement('button');
            favChip.type = 'button';
            favChip.className =
                  'ps-chip ps-chip-fav' + (toolbarState.favoritesOnly ? ' ps-chip-active' : '');
            favChip.textContent = '★ Favorites';
            favChip.addEventListener('click', () => {
                  toolbarState.favoritesOnly = !toolbarState.favoritesOnly;
                  persistPrefs();
                  ActivityLog.log(
                        toolbarState.favoritesOnly ? 'Enabled favorites-only filter' : 'Disabled favorites-only filter'
                  );
                  renderToolbar(toolbar);
                  EventBus.emit('showcase:changed');
            });
            chipRow.appendChild(favChip);
            toolbar.appendChild(chipRow);

            const controlsRow = document.createElement('div');
            controlsRow.className = 'ps-controls-row';

            const sortSelect = document.createElement('select');
            sortSelect.className = 'ps-sort';
            [
                  ['newest', 'Newest first'],
                  ['az', 'A - Z'],
                  ['favorites', 'Favorites first'],
            ].forEach(([value, label]) => {
                  const opt = document.createElement('option');
                  opt.value = value;
                  opt.textContent = label;
                  if (toolbarState.sort === value) opt.selected = true;
                  sortSelect.appendChild(opt);
            });
            sortSelect.addEventListener('change', (e) => {
                  toolbarState.sort = e.target.value;
                  persistPrefs();
                  ActivityLog.log('Sorted by: ' + e.target.selectedOptions[0].textContent);
                  EventBus.emit('showcase:changed');
            });
            controlsRow.appendChild(sortSelect);

            const helpBtn = document.createElement('button');
            helpBtn.type = 'button';
            helpBtn.className = 'ps-help-btn';
            helpBtn.textContent = '?';
            helpBtn.title = 'Keyboard shortcuts';
            helpBtn.addEventListener('click', openShortcuts);
            controlsRow.appendChild(helpBtn);

            // grid <-> list view toggle — purely a layout preference, persisted
            const viewToggleBtn = document.createElement('button');
            viewToggleBtn.type = 'button';
            viewToggleBtn.className = 'ps-help-btn ps-view-toggle';
            viewToggleBtn.textContent = toolbarState.viewMode === 'list' ? '▤' : '☰';
            viewToggleBtn.title = 'Switch between grid and list view';
            viewToggleBtn.addEventListener('click', () => {
                  toolbarState.viewMode = toolbarState.viewMode === 'list' ? 'grid' : 'list';
                  persistPrefs();
                  ActivityLog.log('Switched to ' + toolbarState.viewMode + ' view');
                  renderToolbar(toolbar);
                  EventBus.emit('showcase:changed');
            });
            controlsRow.appendChild(viewToggleBtn);

            // "surprise me" — opens a random project from the currently filtered set
            const surpriseBtn = document.createElement('button');
            surpriseBtn.type = 'button';
            surpriseBtn.className = 'ps-help-btn';
            surpriseBtn.textContent = '🎲';
            surpriseBtn.title = 'Open a random project';
            surpriseBtn.addEventListener('click', openRandomProject);
            controlsRow.appendChild(surpriseBtn);

            // export the favorites list as a downloadable JSON file
            const exportBtn = document.createElement('button');
            exportBtn.type = 'button';
            exportBtn.className = 'ps-help-btn';
            exportBtn.textContent = '⬇';
            exportBtn.title = 'Export favorites as a JSON file';
            exportBtn.addEventListener('click', exportFavorites);
            controlsRow.appendChild(exportBtn);

            // import a favorites JSON file previously produced by the export button
            const importLabel = document.createElement('label');
            importLabel.className = 'ps-help-btn ps-import-label';
            importLabel.textContent = '⬆';
            importLabel.title = 'Import favorites from a JSON file';
            const importInput = document.createElement('input');
            importInput.type = 'file';
            importInput.accept = 'application/json';
            importInput.className = 'ps-import-input';
            importInput.addEventListener('change', (e) => importFavoritesFromFile(e, toolbar));
            importLabel.appendChild(importInput);
            controlsRow.appendChild(importLabel);

            // purely-for-fun activity log — see the ActivityLog module
            const logBtn = document.createElement('button');
            logBtn.type = 'button';
            logBtn.className = 'ps-help-btn';
            logBtn.textContent = '📜';
            logBtn.title = 'Activity log (press l)';
            logBtn.addEventListener('click', toggleActivityPanel);
            controlsRow.appendChild(logBtn);

            toolbar.appendChild(controlsRow);

            const stats = document.createElement('p');
            stats.className = 'ps-stats';
            stats.id = 'ps-stats';
            toolbar.appendChild(stats);

            const recentRow = document.createElement('div');
            recentRow.className = 'ps-recent-row';
            recentRow.id = 'ps-recent-row';
            toolbar.appendChild(recentRow);

            updateStats(toolbar);
            renderRecentlyViewed(toolbar);
      }

      // ---------- recently viewed strip ----------
      // Tracks the last few opened projects (most recent first) so visitors
      // can jump back to something they were just looking at.
      function trackRecentView(id) {
            let recent = Storage.get('recentViews', []);
            recent = recent.filter((existing) => existing !== id);
            recent.unshift(id);
            recent = recent.slice(0, 5);
            Storage.set('recentViews', recent);
            const toolbar = document.querySelector('.ps-toolbar');
            if (toolbar) renderRecentlyViewed(toolbar);
      }

      function renderRecentlyViewed(toolbar) {
            const row = toolbar.querySelector('#ps-recent-row');
            if (!row) return;
            const recent = Storage.get('recentViews', []);
            if (!recent.length) {
                  row.innerHTML = '';
                  return;
            }
            row.innerHTML = '<span class="ps-recent-label">Recently viewed:</span>';
            recent.forEach((id) => {
                  const project = PROJECT_DATA.find((p) => p.id === id);
                  if (!project) return;
                  const chip = document.createElement('button');
                  chip.type = 'button';
                  chip.className = 'ps-recent-chip';
                  chip.textContent = project.title;
                  chip.addEventListener('click', () => openModal(project, chip));
                  row.appendChild(chip);
            });
      }

      // ---------- surprise me ----------
      function openRandomProject() {
            const list = getFilteredSorted();
            const pool = list.length ? list : PROJECT_DATA;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            openModal(pick, document.querySelector('.ps-toolbar .ps-help-btn'));
            Toast.show('Feeling lucky: ' + pick.title);
            ActivityLog.log('Rolled the dice and got: ' + pick.title);
      }

      // ---------- favorites export / import ----------
      // Lets a visitor save their starred projects to a file and load them
      // back later (or on a different device) — a small round-trip nobody
      // strictly needs on a static portfolio site, but it's harmless fun.
      function exportFavorites() {
            const favorites = Storage.get('favorites', []);
            const favoriteProjects = PROJECT_DATA.filter((p) => favorites.includes(p.id)).map((p) => ({
                  id: p.id,
                  title: p.title,
            }));
            const blob = new Blob([JSON.stringify(favoriteProjects, null, 2)], {
                  type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'favorite-projects.json';
            a.click();
            URL.revokeObjectURL(url);
            Toast.show('Favorites exported', 'success');
            ActivityLog.log('Exported ' + favoriteProjects.length + ' favorite(s)');
      }

      function importFavoritesFromFile(e, toolbar) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                  try {
                        const parsed = JSON.parse(reader.result);
                        const ids = Array.isArray(parsed) ? parsed.map((entry) => entry.id).filter(Boolean) : [];
                        const validIds = ids.filter((id) => PROJECT_DATA.some((p) => p.id === id));
                        Storage.set('favorites', validIds);
                        Toast.show('Imported ' + validIds.length + ' favorite(s)', 'success');
                        ActivityLog.log('Imported ' + validIds.length + ' favorite(s) from a file');
                        EventBus.emit('showcase:changed');
                  } catch (err) {
                        Toast.show('That file did not look like a favorites export');
                  }
            };
            reader.readAsText(file);
            e.target.value = '';
      }

      function labelForCategory(cat) {
            const match = PROJECT_DATA.find((p) => p.category === cat);
            return match ? match.categoryLabel : cat;
      }

      function persistPrefs() {
            Storage.set('toolbarPrefs', {
                  category: toolbarState.category,
                  favoritesOnly: toolbarState.favoritesOnly,
                  sort: toolbarState.sort,
                  viewMode: toolbarState.viewMode,
            });
      }

      function updateStats(toolbar) {
            const statsEl = toolbar.querySelector('#ps-stats');
            if (!statsEl) return;
            const favorites = Storage.get('favorites', []);
            const totalViews = PROJECT_DATA.reduce(
                  (sum, p) => sum + Storage.get('views:' + p.id, 0),
                  0
            );
            statsEl.textContent =
                  PROJECT_DATA.length +
                  ' projects · ' +
                  favorites.length +
                  ' favorited · viewed ' +
                  totalViews +
                  ' time' +
                  (totalViews === 1 ? '' : 's') +
                  ' total';
      }

      // ---------- filtering / sorting ----------
      function getFilteredSorted() {
            const favorites = Storage.get('favorites', []);
            let list = PROJECT_DATA.filter((p) => {
                  if (toolbarState.category !== 'all' && p.category !== toolbarState.category) return false;
                  if (toolbarState.favoritesOnly && !favorites.includes(p.id)) return false;
                  if (toolbarState.query) {
                        const haystack = (
                              p.title +
                              ' ' +
                              p.shortDescription +
                              ' ' +
                              p.techStack.join(' ')
                        ).toLowerCase();
                        if (!haystack.includes(toolbarState.query.toLowerCase())) return false;
                  }
                  return true;
            });

            if (toolbarState.sort === 'az') {
                  list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
            } else if (toolbarState.sort === 'favorites') {
                  list = list.slice().sort((a, b) => {
                        const af = favorites.includes(a.id) ? 0 : 1;
                        const bf = favorites.includes(b.id) ? 0 : 1;
                        return af - bf || a.order - b.order;
                  });
            } else {
                  list = list.slice().sort((a, b) => a.order - b.order);
            }

            return list;
      }

      // ---------- grid / cards ----------
      let revealObserver = null;

      function renderGrid(grid) {
            grid.classList.toggle('ps-grid-list', toolbarState.viewMode === 'list');
            grid.innerHTML = '';
            const list = getFilteredSorted();

            if (list.length === 0) {
                  const empty = document.createElement('p');
                  empty.className = 'ps-empty';
                  empty.textContent = 'No projects match that search/filter.';
                  grid.appendChild(empty);
                  return;
            }

            list.forEach((project, i) => grid.appendChild(buildCard(project, i)));
            observeCards(grid);
      }

      // Fades + slides each card in the first time it scrolls into view.
      // Falls back to showing everything immediately on very old browsers
      // that lack IntersectionObserver.
      function observeCards(grid) {
            if (!('IntersectionObserver' in window)) {
                  grid.querySelectorAll('.ps-card-reveal').forEach((el) => el.classList.add('ps-card-revealed'));
                  return;
            }
            if (!revealObserver) {
                  revealObserver = new IntersectionObserver(
                        (entries) => {
                              entries.forEach((entry) => {
                                    if (entry.isIntersecting) {
                                          entry.target.classList.add('ps-card-revealed');
                                          revealObserver.unobserve(entry.target);
                                    }
                              });
                        },
                        { threshold: 0.15 }
                  );
            }
            grid.querySelectorAll('.ps-card-reveal').forEach((el) => revealObserver.observe(el));
      }

      // Builds one project card. `index` only feeds the deterministic
      // pin-vs-tape corner decoration, nothing functional depends on it.
      function buildCard(project, index) {
            const favorites = Storage.get('favorites', []);
            const isFav = favorites.includes(project.id);

            const card = document.createElement('div');
            card.className = 'ps-card ps-card-reveal';
            card.dataset.pin = seeded(index * 4.4) > 0.5 ? 'pin' : 'tape';

            const ribbon = document.createElement('div');
            ribbon.className = 'ps-ribbon ps-ribbon-' + project.status;
            ribbon.textContent = project.statusLabel;
            card.appendChild(ribbon);

            const favBtn = document.createElement('button');
            favBtn.type = 'button';
            favBtn.className = 'ps-fav-btn' + (isFav ? ' ps-fav-active' : '');
            favBtn.innerHTML = isFav ? '★' : '☆';
            favBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
            favBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  toggleFavorite(project.id);
            });
            card.appendChild(favBtn);

            const thumb = document.createElement('div');
            thumb.className = 'ps-card-thumb bg-' + project.color;
            thumb.textContent = project.emoji;
            card.appendChild(thumb);

            const info = document.createElement('div');
            info.className = 'ps-card-info';

            const title = document.createElement('h3');
            title.textContent = project.title;
            info.appendChild(title);

            const desc = document.createElement('p');
            desc.className = 'ps-card-desc';
            desc.textContent = project.shortDescription;
            info.appendChild(desc);

            const tagRow = document.createElement('div');
            tagRow.className = 'ps-tag-row';
            project.techStack.slice(0, 3).forEach((tag) => {
                  const chip = document.createElement('span');
                  chip.className = 'ps-tag';
                  chip.textContent = tag;
                  tagRow.appendChild(chip);
            });
            if (project.techStack.length > 3) {
                  const more = document.createElement('span');
                  more.className = 'ps-tag ps-tag-more';
                  more.textContent = '+' + (project.techStack.length - 3) + ' more';
                  tagRow.appendChild(more);
            }
            info.appendChild(tagRow);

            const detailsBtn = document.createElement('button');
            detailsBtn.type = 'button';
            detailsBtn.className = 'btn';
            detailsBtn.textContent = 'View Details';
            detailsBtn.addEventListener('click', () => openModal(project, detailsBtn));
            info.appendChild(detailsBtn);

            card.appendChild(info);
            return card;
      }

      function toggleFavorite(id) {
            const favorites = Storage.get('favorites', []);
            const idx = favorites.indexOf(id);
            if (idx === -1) {
                  favorites.push(id);
                  Toast.show('Added to favorites', 'success');
                  ActivityLog.log('Favorited: ' + id);
            } else {
                  favorites.splice(idx, 1);
                  Toast.show('Removed from favorites');
                  ActivityLog.log('Unfavorited: ' + id);
            }
            Storage.set('favorites', favorites);
            EventBus.emit('showcase:changed');
      }

      // ---------- modal shell ----------
      function buildModalShell() {
            modalEl = document.createElement('div');
            modalEl.className = 'ps-modal-backdrop';
            modalEl.innerHTML =
                  '<div class="ps-modal" role="dialog" aria-modal="true">' +
                  '<div class="ps-modal-header">' +
                  '<div><span class="ps-modal-date"></span><h3 class="ps-modal-title"></h3></div>' +
                  '<div class="ps-modal-actions">' +
                  '<button type="button" class="ps-icon-btn ps-modal-fav" title="Toggle favorite">☆</button>' +
                  '<button type="button" class="ps-icon-btn ps-modal-share" title="Copy share link">🔗</button>' +
                  '<button type="button" class="ps-icon-btn ps-modal-print" title="Print this project">🖨</button>' +
                  '<button type="button" class="ps-icon-btn ps-modal-close" title="Close">✕</button>' +
                  '</div></div>' +
                  '<div class="ps-tab-bar">' +
                  '<button type="button" class="ps-tab" data-tab="overview">Overview</button>' +
                  '<button type="button" class="ps-tab" data-tab="photos">Photos</button>' +
                  '<button type="button" class="ps-tab" data-tab="video">Video</button>' +
                  '</div>' +
                  '<div class="ps-modal-body">' +
                  '<div class="ps-panel ps-panel-overview"></div>' +
                  '<div class="ps-panel ps-panel-photos"></div>' +
                  '<div class="ps-panel ps-panel-video"></div>' +
                  '</div>' +
                  '<p class="ps-modal-views"></p>' +
                  '</div>';

            modalEl.addEventListener('click', (e) => {
                  if (e.target === modalEl) closeModal();
            });
            modalEl.querySelector('.ps-modal-close').addEventListener('click', closeModal);
            modalEl
                  .querySelector('.ps-modal-share')
                  .addEventListener('click', () => copyShareLink(modalState.project));
            modalEl.querySelector('.ps-modal-print').addEventListener('click', () => printProject());
            modalEl.querySelector('.ps-modal-fav').addEventListener('click', () => {
                  toggleFavorite(modalState.project.id);
                  syncModalFavIcon();
            });

            modalEl.querySelectorAll('.ps-tab').forEach((tabBtn) => {
                  tabBtn.addEventListener('click', () => setModalTab(tabBtn.dataset.tab));
            });

            document.body.appendChild(modalEl);
      }

      function openModal(project, triggerEl) {
            if (!modalEl) buildModalShell();
            lastFocusedEl = triggerEl || document.activeElement;

            modalState.project = project;
            modalState.tab = 'overview';
            modalState.photoIndex = 0;

            modalEl.querySelector('.ps-modal-title').textContent = project.title;
            modalEl.querySelector('.ps-modal-date').textContent = project.dateLabel;

            renderOverviewPanel(project);
            renderPhotosPanel(project);
            renderVideoPanel(project);
            syncModalFavIcon();
            setModalTab('overview');

            const views = incrementViews(project.id);
            trackRecentView(project.id);
            ActivityLog.log('Opened project: ' + project.title);
            modalEl.querySelector('.ps-modal-views').textContent =
                  'Viewed ' + views + ' time' + (views === 1 ? '' : 's') + ' on this device.';

            modalEl.classList.add('ps-open');
            document.body.classList.add('ps-modal-lock');
            modalEl.querySelector('.ps-modal-close').focus();

            if (history.replaceState) {
                  history.replaceState(null, '', location.pathname + location.search + '#project=' + project.id);
            }

            maybeCelebrate(project);
      }

      function closeModal() {
            if (!modalEl) return;
            modalEl.classList.remove('ps-open');
            document.body.classList.remove('ps-modal-lock');
            if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
            if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
      }

      function setModalTab(tab) {
            modalState.tab = tab;
            modalEl.querySelectorAll('.ps-tab').forEach((btn) => {
                  btn.classList.toggle('ps-tab-active', btn.dataset.tab === tab);
            });
            modalEl.querySelectorAll('.ps-panel').forEach((panel) => {
                  panel.classList.toggle('ps-panel-active', panel.classList.contains('ps-panel-' + tab));
            });
      }

      function syncModalFavIcon() {
            const favorites = Storage.get('favorites', []);
            const isFav = favorites.includes(modalState.project.id);
            const btn = modalEl.querySelector('.ps-modal-fav');
            btn.textContent = isFav ? '★' : '☆';
            btn.classList.toggle('ps-fav-active', isFav);
      }

      // ---------- overview panel ----------
      function renderOverviewPanel(project) {
            const panel = modalEl.querySelector('.ps-panel-overview');
            panel.innerHTML = '';

            project.longDescription.forEach((paragraph) => {
                  const p = document.createElement('p');
                  p.textContent = paragraph;
                  panel.appendChild(p);
            });

            if (project.techStack.length) {
                  const badges = document.createElement('div');
                  badges.className = 'badges';
                  badges.style.marginTop = '0.8rem';
                  project.techStack.forEach((tag) => {
                        const badge = document.createElement('span');
                        badge.className = 'brutal-card badge';
                        badge.textContent = tag;
                        badges.appendChild(badge);
                  });
                  panel.appendChild(badges);
            }

            const linkRow = document.createElement('div');
            linkRow.className = 'ps-link-row';
            linkRow.appendChild(buildLinkButton('Source', project.sourceUrl, 'Source Coming Soon'));
            linkRow.appendChild(buildLinkButton('Live Demo', project.demoUrl, 'Demo Coming Soon'));
            panel.appendChild(linkRow);
      }

      function buildLinkButton(label, url, disabledLabel) {
            if (url) {
                  const a = document.createElement('a');
                  a.className = 'btn';
                  a.href = url;
                  a.target = '_blank';
                  a.rel = 'noopener noreferrer';
                  a.textContent = label;
                  return a;
            }
            const btn = document.createElement('button');
            btn.className = 'btn btn-disabled';
            btn.disabled = true;
            btn.textContent = disabledLabel;
            return btn;
      }

      // ---------- photos panel / carousel ----------
      function renderPhotosPanel(project) {
            const panel = modalEl.querySelector('.ps-panel-photos');
            panel.innerHTML = '';

            if (!project.photos.length) {
                  const empty = document.createElement('div');
                  empty.className = 'ps-video-placeholder';
                  empty.innerHTML = '<span class="ps-placeholder-emoji">🖼</span><p>No photos uploaded yet.</p>';
                  panel.appendChild(empty);
                  return;
            }

            const carousel = document.createElement('div');
            carousel.className = 'ps-carousel';

            const viewport = document.createElement('div');
            viewport.className = 'ps-carousel-viewport';
            const track = document.createElement('div');
            track.className = 'ps-carousel-track';

            project.photos.forEach((photo) => {
                  const slide = document.createElement('div');
                  slide.className = 'ps-carousel-slide';
                  if (photo.src) {
                        const img = document.createElement('img');
                        img.src = photo.src;
                        img.alt = photo.label || '';
                        slide.appendChild(img);
                  } else {
                        const tile = document.createElement('div');
                        tile.className = 'ps-photo-tile bg-' + (photo.color || 'yellow');
                        tile.textContent = photo.label || 'Photo';
                        slide.appendChild(tile);
                  }
                  track.appendChild(slide);
            });
            viewport.appendChild(track);
            carousel.appendChild(viewport);

            if (project.photos.length > 1) {
                  const prevBtn = document.createElement('button');
                  prevBtn.type = 'button';
                  prevBtn.className = 'ps-carousel-arrow ps-carousel-prev';
                  prevBtn.innerHTML = '‹';
                  prevBtn.addEventListener('click', () => moveCarousel(-1));
                  carousel.appendChild(prevBtn);

                  const nextBtn = document.createElement('button');
                  nextBtn.type = 'button';
                  nextBtn.className = 'ps-carousel-arrow ps-carousel-next';
                  nextBtn.innerHTML = '›';
                  nextBtn.addEventListener('click', () => moveCarousel(1));
                  carousel.appendChild(nextBtn);

                  const dots = document.createElement('div');
                  dots.className = 'ps-carousel-dots';
                  project.photos.forEach((_, i) => {
                        const dot = document.createElement('button');
                        dot.type = 'button';
                        dot.className = 'ps-carousel-dot';
                        dot.addEventListener('click', () => goToSlide(i));
                        dots.appendChild(dot);
                  });
                  carousel.appendChild(dots);

                  const thumbs = document.createElement('div');
                  thumbs.className = 'ps-carousel-thumbs';
                  project.photos.forEach((photo, i) => {
                        const thumb = document.createElement('button');
                        thumb.type = 'button';
                        thumb.className = 'ps-carousel-thumb bg-' + (photo.color || 'yellow');
                        thumb.textContent = photo.label ? photo.label.charAt(0) : '?';
                        thumb.title = photo.label || '';
                        thumb.addEventListener('click', () => goToSlide(i));
                        thumbs.appendChild(thumb);
                  });
                  carousel.appendChild(thumbs);

                  setupCarouselSwipe(viewport);
            }

            panel.appendChild(carousel);
            updateCarouselPosition();
      }

      function moveCarousel(delta) {
            const total = modalState.project.photos.length;
            modalState.photoIndex = (modalState.photoIndex + delta + total) % total;
            updateCarouselPosition();
      }

      function goToSlide(i) {
            modalState.photoIndex = i;
            updateCarouselPosition();
      }

      function updateCarouselPosition() {
            if (!modalEl) return;
            const track = modalEl.querySelector('.ps-carousel-track');
            if (!track) return;
            track.style.transform = 'translateX(-' + modalState.photoIndex * 100 + '%)';

            modalEl.querySelectorAll('.ps-carousel-dot').forEach((dot, i) => {
                  dot.classList.toggle('ps-carousel-dot-active', i === modalState.photoIndex);
            });
            modalEl.querySelectorAll('.ps-carousel-thumb').forEach((thumb, i) => {
                  thumb.classList.toggle('ps-carousel-thumb-active', i === modalState.photoIndex);
            });
      }

      // basic drag-to-swipe: mouse or touch, via the unified Pointer Events API
      function setupCarouselSwipe(viewport) {
            let startX = 0;
            let dragging = false;

            viewport.addEventListener('pointerdown', (e) => {
                  dragging = true;
                  startX = e.clientX;
            });
            viewport.addEventListener('pointerup', (e) => {
                  if (!dragging) return;
                  dragging = false;
                  const deltaX = e.clientX - startX;
                  if (deltaX > 50) moveCarousel(-1);
                  else if (deltaX < -50) moveCarousel(1);
            });
            viewport.addEventListener('pointerleave', () => {
                  dragging = false;
            });
      }

      // ---------- video panel ----------
      function renderVideoPanel(project) {
            const panel = modalEl.querySelector('.ps-panel-video');
            panel.innerHTML = '';

            if (project.video && project.video.url) {
                  const frame = document.createElement('div');
                  frame.className = 'ps-video-frame';
                  const iframe = document.createElement('iframe');
                  iframe.src = project.video.url;
                  iframe.title = project.title + ' walkthrough video';
                  iframe.allowFullscreen = true;
                  frame.appendChild(iframe);
                  panel.appendChild(frame);

                  if (project.video.caption) {
                        const caption = document.createElement('p');
                        caption.className = 'ps-video-caption';
                        caption.textContent = project.video.caption;
                        panel.appendChild(caption);
                  }
                  return;
            }

            const placeholder = document.createElement('div');
            placeholder.className = 'ps-video-placeholder';
            placeholder.innerHTML =
                  '<span class="ps-placeholder-emoji">🎬</span><p>' +
                  (project.videoNote || 'No video yet.') +
                  '</p>';
            panel.appendChild(placeholder);
      }

      // ---------- view counter ----------
      function incrementViews(id) {
            const key = 'views:' + id;
            const current = Storage.get(key, 0) + 1;
            Storage.set(key, current);
            return current;
      }

      // ---------- confetti trigger ----------
      function maybeCelebrate(project) {
            if (project.status !== 'complete') return;
            const seen = Storage.get('celebrated', []);
            if (seen.includes(project.id)) return;
            seen.push(project.id);
            Storage.set('celebrated', seen);

            const rect = modalEl.querySelector('.ps-modal').getBoundingClientRect();
            Confetti.burst(rect.left + rect.width / 2, rect.top + 80);
      }

      // ---------- share / print ----------
      function copyShareLink(project) {
            const url = location.origin + location.pathname + '#project=' + project.id;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(url).then(
                        () => Toast.show('Link copied!', 'success'),
                        () => fallbackCopy(url)
                  );
            } else {
                  fallbackCopy(url);
            }
      }

      function fallbackCopy(text) {
            const temp = document.createElement('textarea');
            temp.value = text;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            try {
                  document.execCommand('copy');
                  Toast.show('Link copied!', 'success');
            } catch (err) {
                  Toast.show('Could not copy — copy manually: ' + text);
            }
            temp.remove();
      }

      function printProject() {
            document.body.classList.add('ps-printing');
            window.print();
            setTimeout(() => document.body.classList.remove('ps-printing'), 500);
      }

      // ---------- deep link ----------
      function handleDeepLink() {
            const match = location.hash.match(/project=([\w-]+)/);
            if (!match) return;
            const project = PROJECT_DATA.find((p) => p.id === match[1]);
            if (project) setTimeout(() => openModal(project, null), 450);
      }

      // ---------- keyboard shortcuts dialog ----------
      function buildShortcutsModal() {
            shortcutsEl = document.createElement('div');
            shortcutsEl.className = 'ps-modal-backdrop';
            shortcutsEl.innerHTML =
                  '<div class="ps-shortcuts" role="dialog" aria-modal="true">' +
                  '<div class="ps-modal-header">' +
                  '<h3 class="ps-modal-title">Keyboard Shortcuts</h3>' +
                  '<button type="button" class="ps-icon-btn ps-shortcuts-close" title="Close">✕</button>' +
                  '</div>' +
                  '<ul class="ps-shortcuts-list">' +
                  '<li><kbd>/</kbd><span>Focus the search box</span></li>' +
                  '<li><kbd>f</kbd><span>Toggle the favorites-only filter</span></li>' +
                  '<li><kbd>l</kbd><span>Toggle the activity log panel</span></li>' +
                  '<li><kbd>?</kbd><span>Show this help dialog</span></li>' +
                  '<li><kbd>Esc</kbd><span>Close any open dialog</span></li>' +
                  '<li><kbd>←</kbd><kbd>→</kbd><span>Browse photos in an open project</span></li>' +
                  '</ul></div>';
            shortcutsEl.addEventListener('click', (e) => {
                  if (e.target === shortcutsEl) closeShortcuts();
            });
            shortcutsEl.querySelector('.ps-shortcuts-close').addEventListener('click', closeShortcuts);
            document.body.appendChild(shortcutsEl);
      }

      function openShortcuts() {
            if (!shortcutsEl) buildShortcutsModal();
            shortcutsEl.classList.add('ps-open');
      }

      function closeShortcuts() {
            if (shortcutsEl) shortcutsEl.classList.remove('ps-open');
      }

      // ---------- global keyboard handling ----------
      function handleGlobalKeydown(e) {
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            const typing = tag === 'INPUT' || tag === 'TEXTAREA';

            if (e.key === 'Escape') {
                  if (shortcutsEl && shortcutsEl.classList.contains('ps-open')) closeShortcuts();
                  else if (modalEl && modalEl.classList.contains('ps-open')) closeModal();
                  return;
            }

            if (modalEl && modalEl.classList.contains('ps-open') && modalState.tab === 'photos') {
                  if (e.key === 'ArrowLeft') {
                        moveCarousel(-1);
                        return;
                  }
                  if (e.key === 'ArrowRight') {
                        moveCarousel(1);
                        return;
                  }
            }

            if (typing) return;

            if (e.key === '/') {
                  e.preventDefault();
                  const input = document.getElementById('ps-search-input');
                  if (input) input.focus();
            } else if (e.key === 'f') {
                  toolbarState.favoritesOnly = !toolbarState.favoritesOnly;
                  persistPrefs();
                  EventBus.emit('showcase:changed');
                  const toolbar = document.querySelector('.ps-toolbar');
                  if (toolbar) renderToolbar(toolbar);
            } else if (e.key === '?') {
                  openShortcuts();
            } else if (e.key === 'l') {
                  toggleActivityPanel();
            }
      }

      // ---------- debug-only smoke tests ----------
      // Visit projects.html?debug to run these. They check nothing that
      // matters in normal use — they're here purely as an inert sanity
      // check you can opt into, and do nothing otherwise.
      function maybeRunSmokeTests() {
            if (!location.search.includes('debug')) return;
            const results = [];

            results.push(['seeded() is deterministic', seeded(42) === seeded(42)]);

            Storage.set('smoke-test-key', { a: 1 });
            results.push(['Storage round-trips a value', Storage.get('smoke-test-key', null).a === 1]);
            Storage.set('smoke-test-key', undefined);

            let busFired = false;
            const handler = () => {
                  busFired = true;
            };
            EventBus.on('smoke-test-event', handler);
            EventBus.emit('smoke-test-event');
            EventBus.off('smoke-test-event', handler);
            results.push(['EventBus delivers events', busFired]);

            EventBus.emit('smoke-test-event'); // handler was removed — should be a no-op
            results.push(['EventBus.off() actually detaches the handler', busFired === true]);

            results.push(['labelForCategory falls back to the raw key for unknown categories', labelForCategory('not-a-real-category') === 'not-a-real-category']);

            results.push(['labelForCategory resolves a known category', labelForCategory('game') === 'Game']);

            const disabledBtn = buildLinkButton('Source', null, 'Source Coming Soon');
            results.push(['buildLinkButton disables when no URL is given', disabledBtn.disabled === true]);

            const enabledBtn = buildLinkButton('Source', 'https://example.com', 'Source Coming Soon');
            results.push(['buildLinkButton renders a real link when a URL is given', enabledBtn.tagName === 'A']);

            const savedState = Object.assign({}, toolbarState);
            toolbarState = Object.assign({}, toolbarState, { category: 'all', favoritesOnly: false, query: '' });
            results.push(['getFilteredSorted returns every project with no filters active', getFilteredSorted().length === PROJECT_DATA.length]);
            toolbarState = savedState;

            const debounceLog = [];
            const debounced = debounce((v) => debounceLog.push(v), 10);
            debounced('a');
            debounced('b');
            setTimeout(() => {
                  console.log(
                        (debounceLog.length === 1 && debounceLog[0] === 'b' ? 'PASS' : 'FAIL') +
                        ' — debounce() drops superseded calls and keeps only the latest'
                  );
            }, 30);

            console.group('Project Showcase smoke tests');
            results.forEach(([name, passed]) => {
                  console[passed ? 'log' : 'error']((passed ? 'PASS' : 'FAIL') + ' — ' + name);
            });
            console.groupEnd();
      }

      // ---------- styles ----------
      function injectStyles() {
            if (document.getElementById('project-showcase-styles')) return;
            const style = document.createElement('style');
            style.id = 'project-showcase-styles';
            style.textContent = `
      .ps-root { margin-top: 1.5rem; }

      /* ===== TOOLBAR ===== */
      .ps-toolbar {
        border: var(--border);
        box-shadow: var(--shadow);
        background-color: #faf9f5;
        padding: 1.2rem 1.4rem;
        margin-bottom: 2rem;
      }

      .ps-search-wrap { margin-bottom: 0.9rem; }

      .ps-search {
        width: 100%;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1rem;
        padding: 0.6rem 0.8rem;
        border: var(--border);
        background-color: #ffffff;
        color: var(--text);
      }

      .ps-search:focus {
        outline: none;
        box-shadow: 3px 3px 0px #36342e;
      }

      .ps-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-bottom: 0.9rem;
      }

      .ps-chip {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        padding: 0.35rem 0.8rem;
        border: 2px solid var(--text);
        background-color: transparent;
        cursor: pointer;
        transition: transform 0.15s ease, background-color 0.15s ease;
      }

      .ps-chip:hover { transform: translate(-1px, -1px); }

      .ps-chip-active {
        background-color: #eaddb6;
        box-shadow: 2px 2px 0px #36342e;
      }

      .ps-chip-fav.ps-chip-active { background-color: #e0c3c4; }

      .ps-controls-row {
        display: flex;
        align-items: center;
        gap: 0.8rem;
      }

      .ps-sort {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.9rem;
        padding: 0.4rem 0.6rem;
        border: 2px solid var(--text);
        background-color: #ffffff;
        color: var(--text);
      }

      .ps-help-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 2px solid var(--text);
        background-color: #ffffff;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        cursor: pointer;
      }

      .ps-help-btn:hover { background-color: #b5c7cd; }

      .ps-stats {
        margin-top: 0.8rem;
        font-size: 0.85rem !important;
        font-style: italic;
        color: #5a6b7d;
      }

      /* ===== GRID / CARDS ===== */
      .ps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 2rem;
      }

      .ps-card {
        position: relative;
        border: var(--border);
        box-shadow: var(--shadow);
        background-color: #faf9f5;
        padding: 0;
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.4s ease;
      }

      .ps-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: 7px 7px 0px #36342e;
      }

      /* scroll-reveal: starts hidden/offset, the IntersectionObserver in
         JS adds .ps-card-revealed the first time a card enters view */
      .ps-card-reveal {
        opacity: 0;
        transform: translateY(16px);
      }

      .ps-card-revealed {
        opacity: 1;
        transform: translateY(0);
      }

      /* ===== LIST VIEW ===== */
      .ps-grid-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .ps-grid-list .ps-card {
        display: flex;
        align-items: stretch;
      }

      .ps-grid-list .ps-card-thumb {
        width: 140px;
        height: auto;
        flex-shrink: 0;
        border-bottom: none;
        border-right: var(--border);
      }

      .ps-grid-list .ps-card-info {
        flex: 1;
      }

      /* ===== RECENTLY VIEWED ===== */
      .ps-recent-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.6rem;
      }

      .ps-recent-label {
        font-size: 0.8rem;
        font-style: italic;
        color: #5a6b7d;
      }

      .ps-recent-chip {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.2rem 0.6rem;
        border: 2px solid var(--text);
        background-color: #ffffff;
        cursor: pointer;
      }

      .ps-recent-chip:hover { background-color: #b5c7cd; }

      /* the import button is a <label> wrapping a transparent file input,
         so the whole square is clickable but styled like the other icon buttons */
      .ps-import-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }

      .ps-import-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      .ps-card[data-pin="pin"]::before {
        content: '';
        position: absolute;
        top: -9px;
        left: 50%;
        transform: translateX(-50%);
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #f28b82, #c8463c 70%);
        box-shadow: 1px 2px 2px rgba(0,0,0,0.4);
        z-index: 2;
      }

      .ps-card[data-pin="tape"]::before {
        content: '';
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%) rotate(-2deg);
        width: 70px;
        height: 20px;
        background-color: rgba(255,255,255,0.65);
        border: 1px solid rgba(54,52,46,0.15);
        z-index: 2;
      }

      .ps-ribbon {
        position: absolute;
        top: 14px;
        right: -32px;
        transform: rotate(40deg);
        width: 140px;
        text-align: center;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.25rem 0;
        border: 2px solid var(--text);
        z-index: 3;
      }

      .ps-ribbon-complete { background-color: #c7d1ab; }
      .ps-ribbon-planned { background-color: #dfbfa8; }

      .ps-fav-btn {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 3;
        width: 32px;
        height: 32px;
        border: 2px solid var(--text);
        background-color: #faf9f5;
        font-size: 1.1rem;
        line-height: 1;
        cursor: pointer;
        transition: transform 0.15s ease;
      }

      .ps-fav-btn:hover { transform: scale(1.1); }
      .ps-fav-active { background-color: #eaddb6; }

      .ps-card-thumb {
        height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.6rem;
        border-bottom: var(--border);
      }

      .ps-card-info { padding: 1.3rem; }

      .ps-card-info h3 { margin-bottom: 0.5rem; }

      .ps-card-desc {
        font-size: 1.5rem !important;
        margin-bottom: 0.8rem;
      }

      .ps-tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 1rem;
      }

      .ps-tag {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.2rem 0.5rem;
        background-color: #f4f1ea;
        border: 1px solid rgba(54,52,46,0.3);
      }

      .ps-tag-more { color: #5a6b7d; }

      .ps-empty {
        grid-column: 1 / -1;
        text-align: center;
        font-size: 1.6rem !important;
        padding: 2rem;
      }

      /* ===== SKELETON ===== */
      .ps-skeleton { cursor: default; }

      .ps-skeleton-thumb {
        height: 160px;
        background: linear-gradient(100deg, #e9e6dc 30%, #f4f1ea 50%, #e9e6dc 70%);
        background-size: 200% 100%;
        animation: ps-shimmer 1.4s infinite;
      }

      .ps-skeleton-line {
        height: 12px;
        margin: 1rem 1.3rem 0;
        background: linear-gradient(100deg, #e9e6dc 30%, #f4f1ea 50%, #e9e6dc 70%);
        background-size: 200% 100%;
        animation: ps-shimmer 1.4s infinite;
      }

      .ps-skeleton-line-wide { width: 70%; }
      .ps-skeleton-line-short { width: 40%; margin-bottom: 1.3rem; }

      @keyframes ps-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* ===== MODAL ===== */
      .ps-modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(54, 52, 46, 0.82);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        z-index: 1100;
      }

      .ps-modal-backdrop.ps-open { display: flex; }

      body.ps-modal-lock { overflow: hidden; }

      .ps-modal {
        width: min(720px, 100%);
        max-height: 85vh;
        overflow-y: auto;
        background-color: #faf9f5;
        border: var(--border);
        box-shadow: 8px 8px 0px #36342e;
        padding: 1.6rem;
      }

      .ps-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 3px solid var(--text);
        padding-bottom: 0.8rem;
        margin-bottom: 1rem;
      }

      .ps-modal-date {
        display: block;
        font-size: 0.85rem;
        font-style: italic;
        color: #5a6b7d;
      }

      .ps-modal-title { margin: 0.2rem 0 0; }

      .ps-modal-actions { display: flex; gap: 0.5rem; }

      .ps-icon-btn {
        width: 34px;
        height: 34px;
        border: 2px solid var(--text);
        background-color: #ffffff;
        cursor: pointer;
        font-size: 1rem;
      }

      .ps-icon-btn:hover { background-color: #b5c7cd; }
      .ps-modal-fav.ps-fav-active { background-color: #eaddb6; }

      .ps-tab-bar {
        display: flex;
        gap: 0.4rem;
        margin-bottom: 1.2rem;
      }

      .ps-tab {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
        border: 2px solid var(--text);
        background-color: transparent;
        cursor: pointer;
      }

      .ps-tab-active { background-color: #b5c7cd; }

      .ps-panel { display: none; }
      .ps-panel-active { display: block; }

      .ps-panel-overview p {
        font-size: 1.6rem !important;
        margin-bottom: 0.6rem;
      }

      .ps-link-row {
        display: flex;
        gap: 1rem;
        margin-top: 1.2rem;
        flex-wrap: wrap;
      }

      .ps-modal-views {
        margin-top: 1.2rem;
        font-size: 0.8rem !important;
        font-style: italic;
        color: #5a6b7d;
      }

      /* ===== CAROUSEL ===== */
      .ps-carousel { position: relative; }

      .ps-carousel-viewport {
        overflow: hidden;
        border: 2px solid var(--text);
        touch-action: pan-y;
      }

      .ps-carousel-track {
        display: flex;
        transition: transform 0.3s ease;
      }

      .ps-carousel-slide {
        min-width: 100%;
        height: 260px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ps-carousel-slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ps-photo-tile {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 1.3rem;
      }

      .ps-carousel-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 38px;
        height: 38px;
        border: 2px solid var(--text);
        background-color: #faf9f5;
        font-size: 1.4rem;
        line-height: 1;
        cursor: pointer;
      }

      .ps-carousel-prev { left: -14px; }
      .ps-carousel-next { right: -14px; }

      .ps-carousel-dots {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin: 0.8rem 0;
      }

      .ps-carousel-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid var(--text);
        background-color: #ffffff;
        cursor: pointer;
        padding: 0;
      }

      .ps-carousel-dot-active { background-color: #36342e; }

      .ps-carousel-thumbs {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .ps-carousel-thumb {
        width: 40px;
        height: 40px;
        border: 2px solid var(--text);
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        cursor: pointer;
        opacity: 0.6;
      }

      .ps-carousel-thumb-active { opacity: 1; box-shadow: 2px 2px 0px #36342e; }

      /* ===== VIDEO ===== */
      .ps-video-frame {
        position: relative;
        width: 100%;
        padding-bottom: 56.25%;
        border: 2px solid var(--text);
      }

      .ps-video-frame iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
      }

      .ps-video-caption {
        margin-top: 0.6rem;
        font-size: 1.4rem !important;
        font-style: italic;
      }

      .ps-video-placeholder {
        border: 3px dashed rgba(54,52,46,0.35);
        padding: 3rem 1.5rem;
        text-align: center;
      }

      .ps-placeholder-emoji {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 0.6rem;
      }

      /* ===== TOASTS ===== */
      .ps-toast-stack {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        z-index: 1200;
      }

      .ps-toast {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 0.9rem;
        padding: 0.7rem 1.1rem;
        border: var(--border);
        box-shadow: var(--shadow);
        background-color: #faf9f5;
        opacity: 0;
        transform: translateX(20px);
        transition: opacity 0.25s ease, transform 0.25s ease;
      }

      .ps-toast-in { opacity: 1; transform: translateX(0); }
      .ps-toast-out { opacity: 0; transform: translateX(20px); }
      .ps-toast-success { background-color: #c7d1ab; }

      /* ===== CONFETTI ===== */
      .ps-confetti-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1300;
      }

      .ps-confetti-piece {
        position: absolute;
        width: 8px;
        height: 8px;
        animation: ps-confetti-fall 1.1s ease-out forwards;
        animation-delay: var(--delay, 0s);
      }

      @keyframes ps-confetti-fall {
        0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; }
      }

      /* ===== ACTIVITY LOG PANEL ===== */
      .ps-activity-panel {
        position: fixed;
        bottom: 1.5rem;
        left: 1.5rem;
        width: min(320px, calc(100vw - 3rem));
        max-height: 60vh;
        display: flex;
        flex-direction: column;
        background-color: #faf9f5;
        border: var(--border);
        box-shadow: var(--shadow);
        transform: translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.2s ease, opacity 0.2s ease;
        z-index: 1150;
      }

      .ps-activity-panel.ps-open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      .ps-activity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.7rem 0.9rem;
        border-bottom: 2px solid var(--text);
      }

      .ps-activity-header .ps-icon-btn {
        width: 28px;
        height: 28px;
        font-size: 0.85rem;
        margin-left: 0.4rem;
      }

      .ps-activity-list {
        list-style: none;
        overflow-y: auto;
        padding: 0.6rem 0.9rem;
      }

      .ps-activity-list li {
        font-size: 0.78rem;
        line-height: 1.4;
        padding: 0.3rem 0;
        border-bottom: 1px solid rgba(54,52,46,0.12);
      }

      .ps-activity-list li:last-child { border-bottom: none; }

      .ps-activity-empty {
        font-style: italic;
        color: #5a6b7d;
      }

      /* ===== SHORTCUTS DIALOG ===== */
      .ps-shortcuts {
        width: min(420px, 100%);
        background-color: #faf9f5;
        border: var(--border);
        box-shadow: 8px 8px 0px #36342e;
        padding: 1.4rem 1.6rem;
      }

      .ps-shortcuts-list { list-style: none; margin-top: 0.6rem; }

      .ps-shortcuts-list li {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.6rem;
        font-size: 1.4rem !important;
      }

      .ps-shortcuts-list kbd {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.8rem;
        padding: 0.15rem 0.5rem;
        border: 2px solid var(--text);
        background-color: #ffffff;
      }

      /* ===== PRINT ===== */
      @media print {
        body.ps-printing > *:not(.ps-modal-backdrop) { display: none !important; }
        body.ps-printing .ps-modal-backdrop { position: static; background: none; padding: 0; }
        body.ps-printing .ps-modal { box-shadow: none; max-height: none; overflow: visible; }
        body.ps-printing .ps-modal-actions,
        body.ps-printing .ps-tab-bar { display: none; }
        body.ps-printing .ps-panel { display: block !important; margin-bottom: 1.5rem; }
      }

      /* ===== MOBILE ===== */
      @media (max-width: 700px) {
        .ps-controls-row { flex-wrap: wrap; }
        .ps-carousel-prev { left: 4px; }
        .ps-carousel-next { right: 4px; }
        .ps-modal { padding: 1.1rem; }
        .ps-ribbon { right: -38px; }
      }
    `;
            document.head.appendChild(style);
      }
})();
