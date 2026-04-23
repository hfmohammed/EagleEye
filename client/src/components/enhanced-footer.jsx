"use client"

import { Crosshair, Github } from "lucide-react"

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="ee-surface mt-auto border-t border-ee-border/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-ee-accent/30 bg-ee-inset text-ee-accent">
            <Crosshair className="size-4" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ee-text">Eagle Eye</p>
            <p className="mt-1 max-w-md font-mono text-[11px] leading-relaxed text-ee-muted">
              CCTV / object detection. Authorized access only.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-ee-muted">
          <span className="tabular-nums">© {year}</span>
          <a
            href="https://github.com"
            className="inline-flex items-center gap-1.5 rounded-sm border border-transparent px-2 py-1 hover:border-ee-border hover:bg-ee-inset hover:text-ee-text"
            aria-label="GitHub"
          >
            <Github className="size-3.5" strokeWidth={1.75} />
            Repo
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
