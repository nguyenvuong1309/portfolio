# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Architecture

This is a Next.js 15 portfolio website built with the App Router, TypeScript, and Tailwind CSS. The application features a modern single-page layout with smooth scrolling navigation and dark/light theme support.

### Key Architecture Patterns

**Context-Based State Management**
- `ActiveSectionContext`: Tracks which section is currently in view for navigation highlighting
- `ThemeContext`: Manages dark/light theme state with localStorage persistence
- Both contexts use custom hooks (`useActiveSectionContext`, `useTheme`) with error boundaries

**Section-Based Navigation**
- Navigation links defined in `lib/data.ts` with hash-based routing
- `useSectionInView` hook combines Intersection Observer API with context to automatically update active section
- Time-based click detection prevents observer conflicts during manual navigation

**Component Structure**
- Page sections: `intro.tsx`, `about.tsx`, `projects.tsx`, `skills.tsx`, `experience.tsx`, `contact.tsx`
- Layout components: `header.tsx`, `footer.tsx`, `section-heading.tsx`, `section-divider.tsx`
- Interactive components: `theme-switch.tsx`, `submit-btn.tsx`
- All major sections use the `useSectionInView` hook for consistent behavior

**Data Management**
- Static data centralized in `lib/data.ts`: navigation links, experience timeline, projects, skills
- Type definitions in `lib/types.ts` derive types from data (e.g., `SectionName`)
- Images stored in `public/` directory and imported as modules

**Email System**
- Server actions in `actions/sendEmail.ts` handle form submissions
- Uses Resend service with React Email templates (`email/contact-form-email.tsx`)
- Requires `RESEND_API_KEY` environment variable in `.env.local`
- Email recipient configured in `sendEmail.ts:30`

### Technology Stack Integration

**Framer Motion**: Used for page animations and transitions
**React Intersection Observer**: Powers the section visibility detection
**React Hot Toast**: Provides user feedback for form submissions
**React Icons**: Icon system throughout the application
**Tailwind CSS**: Utility-first styling with dark mode support
**TypeScript**: Strict typing with const assertions for data arrays

### Configuration Files

- `next.config.js`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration with dark mode
- `tsconfig.json`: TypeScript compiler options
- `postcss.config.js`: PostCSS configuration for Tailwind

## Setup Requirements

1. Add `RESEND_API_KEY` environment variable in `.env.local`
2. Update email recipient in `actions/sendEmail.ts` line 30
3. Install dependencies: `npm install` or `yarn install`