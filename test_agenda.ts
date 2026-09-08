import { generateEventsForMonth } from './frontend/src/utils/agendaGenerator';

const events = generateEventsForMonth(2026, 9, []);
console.log(events.filter(e => e.date.includes('-05') || e.date.includes('-12') || e.date.includes('-19') || e.title.includes('Departamental')));
