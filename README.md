# Lakshya - Career Evidence Lab

A linear workshop app for turning a resume, portfolio URL, or project spreadsheet into an interactive career evidence map.

## Flow

1. Evidence - upload resume / portfolio / project data, or paste a public portfolio URL.
2. Processing - extract project evidence and build a browser-local career data instance.
3. Career map - explore factual visualizations, inferred patterns, skill signals, ratings, filters, and editable project records.

## Project template

The app generates Lakshya_Project_Template.xlsx with one sheet and one row per project. It includes dates, client, expectation, outcome, device / medium, business model, industry, customer rating, evidence, and yes/no process columns.

## Data model

The browser creates a local IndexedDB database named lakshya-career-db with project, skill, and profile stores. LocalStorage is also used for session persistence. No Lakshya backend is required for the prototype.

## Fact, inference, insight

- Fact = directly present or countable in uploaded evidence.
- Inference = derived by aggregating project signals.
- Insight = an interpretation intended to help the participant notice a career pattern.

The app deliberately keeps these levels separate.

## GitHub Pages

The included workflow deploys the root of main to GitHub Pages.
