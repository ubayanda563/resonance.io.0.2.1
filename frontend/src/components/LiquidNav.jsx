import React, { useRef, useEffect, useState, useCallback, memo } from 'react';

/**
 * LiquidNav — Apple Liquid Glass navigation with:
 *  - Animated blob mesh background
 *  - Spring-animated sliding pill indicator
 *  - Interactive mouse-following glare
 *  - Light/dark theme toggle
 *
 * Used for both desktop sidebar nav and mobile bottom tab bar.
 */

/* ── Blob Background ─────────────────────────────────────────────── */
export const BlobMesh = memo(() => (
  <div className="bg-mesh" aria-hidden="true">
    <div className="blob blob-1" />
    <div className="blob blob-2" />
    <div className="blob blob-3" />
  </div>
));
BlobMesh.displayName = 'BlobMesh';

/* ── Theme toggle button ─────────────────────────────────────────── */
export const ThemeToggle = memo(({ size = 20 }) => {
  const toggle = useCallback(() => {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') !== 'light';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
  }, []);

  return (
    <button
      onClick={toggle}
      className="theme-toggle w-11 h-11"
      aria-label="Toggle light/dark mode"
    >
      <div className="theme-icon-wrap" style={{ width: size, height: size }}>
        {/* Sun */}
        <svg className="icon-sun" width={size} height={size} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"  x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1"  y1="12" x2="3"  y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>
        {/* Moon */}
        <svg className="icon-moon" width={size} height={size} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </div>
    </button>
  );
});
ThemeToggle.displayName = 'ThemeToggle';

/* ── Liquid Glass surface with interactive glare ─────────────────── */
export const LiquidSurface = memo(({ children, className = '', style = {}, pill = false, onClick }) => {
  const ref    = useRef(null);
  const glare  = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current || !glare.current) return;
    const rect = ref.current.getBoundingClientRect();
    glare.current.style.setProperty('--gx', `${e.clientX - rect.left}px`);
    glare.current.style.setProperty('--gy', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`liquid-glass ${pill ? 'liquid-pill' : 'liquid-card'} ${className}`}
      style={style}
    >
      <div className="lg-glare-wrap">
        <div className="lg-glare" ref={glare} />
      </div>
      {children}
    </div>
  );
});
LiquidSurface.displayName = 'LiquidSurface';

/* ── Sidebar Liquid Nav ──────────────────────────────────────────── */
export const LiquidSidebarNav = memo(({ items, activeId, onNavigate, currentTrack, isPlaying }) => {
  const btnRefs  = useRef({});
  const pillRef  = useRef(null);
  const navRef   = useRef(null);
  const glareRef = useRef(null);

  const updatePill = useCallback((id, animate = true) => {
    const btn  = btnRefs.current[id];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    if (!animate) pill.style.transition = 'none';
    else pill.style.transition = '';
    pill.style.width     = `${btn.offsetWidth}px`;
    pill.style.height    = `${btn.offsetHeight}px`;
    pill.style.transform = `translateY(${btn.offsetTop}px)`;
    if (!animate) {
      void pill.offsetWidth; // force reflow
      pill.style.transition = '';
    }
  }, []);

  useEffect(() => { setTimeout(() => updatePill(activeId, false), 50); }, []);
  useEffect(() => { updatePill(activeId); }, [activeId]);

  useEffect(() => {
    const obs = new ResizeObserver(() => updatePill(activeId, false));
    if (navRef.current) obs.observe(navRef.current);
    return () => obs.disconnect();
  }, [activeId]);

  const handleMouseMove = useCallback((e) => {
    if (!navRef.current || !glareRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    glareRef.current.style.setProperty('--gx', `${e.clientX - rect.left}px`);
    glareRef.current.style.setProperty('--gy', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={navRef}
      onMouseMove={handleMouseMove}
      className="liquid-glass relative flex flex-col p-2"
      style={{ borderRadius: '1.25rem', flex: 1 }}
    >
      <div className="lg-glare-wrap" style={{ borderRadius: '1.25rem' }}>
        <div className="lg-glare" ref={glareRef} />
      </div>

      {/* Sliding pill */}
      <div ref={pillRef} className="liquid-nav-pill absolute left-2 right-2" />

      {/* Nav items */}
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          ref={el => { if (el) btnRefs.current[id] = el; }}
          onClick={() => onNavigate(id)}
          className={`liquid-nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${activeId === id ? 'active' : ''}`}
          aria-current={activeId === id ? 'page' : undefined}
        >
          <div className="liquid-nav-btn-inner">
            <Icon size={16} />
            <span className="hidden lg:block">{label}</span>
          </div>
        </button>
      ))}

      {/* Now-playing indicator */}
      {currentTrack && (
        <div className="mt-auto pt-3 border-t hidden lg:flex items-center gap-2.5 overflow-hidden"
          style={{ borderColor: 'var(--glass-border)' }}>
          <img src={currentTrack.artwork_url} alt=""
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0 ring-1"
            style={{ ringColor: 'var(--glass-border)' }} />
          <div className="min-w-0 flex-1">
            <p className="text-xs truncate" style={{ color: 'var(--chi)' }}>{currentTrack.title}</p>
            {isPlaying && (
              <div className="flex items-end gap-[2px] mt-0.5 h-3">
                {[2,4,3,5,2].map((h,i) => (
                  <div key={i} className="w-[2px] rounded-full"
                    style={{
                      height: h * 2.5, background: 'var(--amber)',
                      animation: `eq-pulse 0.9s ease-in-out infinite`,
                      animationDelay: `${i * 110}ms`,
                    }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
LiquidSidebarNav.displayName = 'LiquidSidebarNav';

/* ── Mobile Bottom Tab Bar ───────────────────────────────────────── */
export const LiquidBottomNav = memo(({
  items, activeId, onNavigate,
  currentTrack, isPlaying,
  onPlayerTap, onPlayPause, onSkip,
}) => {
  const btnRefs  = useRef({});
  const pillRef  = useRef(null);
  const navRef   = useRef(null);
  const glareRef = useRef(null);

  const updatePill = useCallback((id, animate = true) => {
    const btn  = btnRefs.current[id];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    if (!animate) pill.style.transition = 'none';
    else pill.style.transition = '';
    pill.style.width     = `${btn.offsetWidth}px`;
    pill.style.height    = `${btn.offsetHeight}px`;
    pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    if (!animate) { void pill.offsetWidth; pill.style.transition = ''; }
  }, []);

  useEffect(() => { setTimeout(() => updatePill(activeId, false), 50); }, []);
  useEffect(() => { updatePill(activeId); }, [activeId]);

  const handleMouseMove = useCallback((e) => {
    if (!navRef.current || !glareRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    glareRef.current.style.setProperty('--gx', `${e.clientX - rect.left}px`);
    glareRef.current.style.setProperty('--gy', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

      {/* Mini player strip */}
      {currentTrack && (
        <div
          onMouseMove={handleMouseMove}
          onClick={onPlayerTap}
          className="liquid-glass liquid-surface mx-3 mb-2 flex items-center gap-3 px-3 py-2.5 cursor-pointer"
          style={{ borderRadius: '1.25rem' }}
        >
          <div className="lg-glare-wrap" style={{ borderRadius: '1.25rem' }}>
            <div className="lg-glare" ref={glareRef} />
          </div>
          <img src={currentTrack.artwork_url} alt={currentTrack.title}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0 ring-1"
            style={{ ringColor: 'var(--glass-border)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--chi)' }}>
              {currentTrack.title}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--icon-color)' }}>
              {currentTrack.artist}
            </p>
          </div>
          {isPlaying && (
            <div className="flex items-end gap-[2px] h-5 flex-shrink-0 mr-1">
              {[3,5,4,6,3].map((h,i) => (
                <div key={i} className="w-[3px] rounded-full"
                  style={{
                    height: h * 3, background: 'var(--amber)',
                    animation: `eq-pulse 0.9s ease-in-out infinite`,
                    animationDelay: `${i * 120}ms`,
                  }} />
              ))}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
            className="btn-play w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:1}}><polygon points="5,3 19,12 5,21"/></svg>
            }
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSkip(); }}
            className="glass-button-dark w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            aria-label="Skip next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none"/>
              <line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div
        ref={navRef}
        onMouseMove={handleMouseMove}
        className="liquid-glass liquid-surface mx-3 mb-3 flex items-center px-2 py-1.5 relative"
        style={{ borderRadius: '1.5rem' }}
      >
        <div className="lg-glare-wrap" style={{ borderRadius: '1.5rem' }}>
          <div className="lg-glare" />
        </div>
        {/* Sliding pill */}
        <div ref={pillRef} className="liquid-nav-pill absolute" style={{ top: 6, bottom: 6 }} />

        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            ref={el => { if (el) btnRefs.current[id] = el; }}
            onClick={() => onNavigate(id)}
            className={`liquid-nav-btn flex-1 flex flex-col items-center gap-1 py-2 ${activeId === id ? 'active' : ''}`}
            aria-label={label}
          >
            <div className="liquid-nav-btn-inner flex-col gap-1">
              <Icon size={19} />
              <span className="text-[9px] font-medium tracking-wide mobile-tab-label">{label}</span>
            </div>
          </button>
        ))}

        <div className="liquid-divider mx-1" style={{ height: 24 }} />
        <ThemeToggle size={18} />
      </div>
    </div>
  );
});
LiquidBottomNav.displayName = 'LiquidBottomNav';
