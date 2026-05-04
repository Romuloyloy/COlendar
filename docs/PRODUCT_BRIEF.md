# Product Brief

## Project Name

Working title: **Personal Productivity Dashboard**

This is a working title. It can be renamed later.

## One-Sentence Description

A desktop-first personal productivity web app that combines notes, daily planning, weekly planning, simple calendar events, and lightweight activity tracking into one clean dashboard.

## Product Identity

This app is not primarily an AI app.

It is a **dashboard and productivity app first**. LLM or AI features may be added later, but the core product must work well without them.

The long-term vision is a customizable personal workspace where the user can organize different life areas such as work, school, health, routines, and personal notes.

## Primary User

The primary user is the creator of the app.

The app should initially be designed for personal use on a PC/browser. It may later support another user, such as a roommate, but collaboration, teams, roles, and sharing are not part of the MVP.

## Main User Goals

The user wants to:

1. Open the app and immediately understand the day.
2. Track daily to-dos and recurring weekly responsibilities.
3. Store notes in an organized folder structure.
4. Add simple calendar events without needing an external calendar app.
5. Track lightweight daily activity such as water intake or activity.
6. Customize the workspace later through widgets, sheets, and pages.
7. Build the project using serious software engineering practices.

## Core Product Values

### 1. Fast Access

The app should feel quick to open and quick to use. The user should not need many clicks to add a task, note, event, or tracker entry.

### 2. Clear Daily Overview

The dashboard should answer: "What matters today?"

### 3. Customizable Later

The MVP does not need full customization, but the architecture should allow future customizable dashboards, widgets, and sheets.

### 4. Modular and Extendable

New features should be addable without rewriting the whole app.

### 5. Local-First at the Start

The first version is intended to run locally on the user's PC. The project should still be structured so that deployment to a server is possible later.

### 6. Serious-App Engineering

Even though this is a personal project, it should use production-like habits: clean architecture, environment configuration, database migrations, tests, logging, documentation, and reproducible setup.

## What Makes This App Different Long-Term

The long-term signature idea is a **sheet-based dashboard workspace**:

- A sheet covers the entire viewport.
- Each sheet uses a fixed grid layout, currently imagined as 4 columns by 2 rows.
- Each grid cell contains a widget.
- Widgets may later be stretchable, for example 1x2 or 2x1.
- A top-center dropdown or command bar appears when the mouse moves near the top middle area.
- This dropdown gives access to navigation and major app sections.
- Users can move between sheets using left/right controls.
- There is no traditional scrolling in the final sheet-based interface.

This is not part of the MVP implementation. However, the MVP should be designed so that this system can be added later.

## MVP Product Direction

The MVP should use a simpler fixed dashboard layout first.

The dashboard should contain sections for:

- Today
- Daily to-dos
- Weekly to-dos
- Upcoming events
- Quick notes or recent notes
- Water/activity tracking

These sections can later become formal widgets.

## Explicit Non-Goals for MVP

The MVP should not include:

- AI assistant features
- LLM chat inside the app
- External calendar sync
- Collaboration
- Multiple roles or permissions
- Mobile app
- Full drag-and-drop dashboard customization
- Full sheet/grid system
- Plugin system
- Advanced analytics
- Complex recurring calendar logic
- Notifications beyond simple in-app reminders, unless added later

## Success Criteria for First Usable Version

The first usable version is successful when the user can:

1. Run the app locally with a reproducible setup.
2. Open a dashboard.
3. Create, edit, complete, and view daily tasks.
4. Create and view weekly recurring tasks.
5. Create folders and notes.
6. Create simple calendar events.
7. Add water/activity tracker entries.
8. See useful information on the dashboard without customization.
9. Trust that data persists in the database.
10. Understand the project structure well enough to continue building features.

## Product Principle

Build a simple app that works first, but avoid choices that block the future customizable workspace.

The app should be simple in the UI at first, but modular in the architecture from the beginning.
