# Development Notes

## Material-UI Configuration

- **Version**: Fixed at 7.2
- **Grid Component**: Use `Grid2 as Grid` instead of the legacy Grid component to avoid TypeScript errors
- **Theme**: Custom theme configured in `src/theme/muiTheme.ts` matching HR system design colors

## Environment Setup

- Supabase PostgreSQL database integration
- Environment variables required: `REACT_APP_SUPABASE_ANON_KEY`

## Development Commands

- `npm start` - Start development server
- `npm run build` - Build for production