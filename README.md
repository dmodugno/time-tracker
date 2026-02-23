# Time Tracker

A browser-based time tracking application that stores data directly in a CSV file on your computer using the File System Access API.

## Features

- **Timer**: Start/Stop timer with live elapsed time display (survives page refresh)
- **Sessions Management**: View, edit, add, and delete time sessions
- **Import/Merge**: Merge sessions from other CSV files with automatic deduplication
- **Reports**: View time summaries for this week, month, and year
- **12-Hour Time Format**: All times displayed in 12-hour format with AM/PM
- **Direct CSV Storage**: All data stored in a CSV file on your computer (compatible with Excel/Numbers)

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- PapaParse (CSV parsing)
- File System Access API

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in Chrome or Edge

4. Create or open a CSV file to start tracking time

## Browser Requirements

This app requires the File System Access API, which is supported in:
- Chrome 86+
- Edge 86+

Not supported in Firefox or Safari.

## CSV Format

The app uses the following CSV schema:

```csv
id,date,start_time,end_time,duration_hours
abc123,2026-02-23,09:00,12:30,3.50
```

- **id**: UUID for each session
- **date**: YYYY-MM-DD format
- **start_time**: HH:MM format (24-hour)
- **end_time**: HH:MM format (24-hour)
- **duration_hours**: Decimal hours (auto-calculated)

## License

MIT
