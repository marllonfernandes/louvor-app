import { WorshipEvent, EventType } from '../types';

/**
 * Função utilitária para gerar eventos fixos da agenda de um determinado mês e ano.
 * 
 * Regras da Igreja:
 * - Terças (20:00): Culto de Oração
 * - Quintas (20:00): Culto de Ensinamento
 * - Sextas (20:00): Ensaio
 * - Sábados (19:30): Culto Departamental (exceto 2º sábado que é livre)
 * - 1º Domingo (08:30): Santa Ceia (não há culto à noite)
 * - Outros Domingos (18:30): Culto com a Família
 */

export function generateEventsForMonth(year: number, month: number, existingEvents: WorshipEvent[]): Omit<WorshipEvent, 'id'>[] {
  const generatedEvents: Omit<WorshipEvent, 'id'>[] = [];
  
  // O construtor do Date com (year, month, 0) pega o último dia do mês anterior, 
  // então para pegar a quantidade de dias do mês atual, usamos month + 1, dia 0.
  // Note: O parâmetro 'month' aqui é 0-indexed (0 = Jan, 11 = Dec) 
  // caso venha do seletor que usaremos, precisamos garantir a tipagem.
  // Vamos assumir que 'month' entra como 1-indexed (1 = Jan, 12 = Dec).
  
  const daysInMonth = new Date(year, month, 0).getDate();

  let saturdayCount = 0;
  let sundayCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    // JavaScript Date usa mês 0-indexed.
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Seg, ..., 6 = Sábado
    
    // Formatação da data YYYY-MM-DD
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let eventTitle = '';
    let eventType: EventType = 'outro';
    let eventTime = '';

    if (dayOfWeek === 0) {
      // DOMINGO
      sundayCount++;
      if (sundayCount === 1) {
        eventTitle = 'Santa Ceia';
        eventType = 'ceia';
        eventTime = '08:30';
      } else {
        eventTitle = 'Culto com a Família';
        eventType = 'culto';
        eventTime = '18:30';
      }
    } else if (dayOfWeek === 2) {
      // TERÇA
      eventTitle = 'Culto de Oração';
      eventType = 'culto';
      eventTime = '20:00';
    } else if (dayOfWeek === 4) {
      // QUINTA
      eventTitle = 'Culto de Ensinamento';
      eventType = 'culto';
      eventTime = '20:00';
    } else if (dayOfWeek === 5) {
      // SEXTA
      eventTitle = 'Ensaio';
      eventType = 'ensaio';
      eventTime = '20:00';
    } else if (dayOfWeek === 6) {
      // SÁBADO
      saturdayCount++;
      if (saturdayCount !== 2) {
        eventTitle = 'Culto Departamental';
        eventType = 'outro';
        eventTime = '19:30';
      }
    }

    if (eventTitle) {
      // Verifica se já existe um evento com o mesmo título neste dia para evitar duplicatas
      const alreadyExists = existingEvents.some(
        ev => ev.date === dateString && ev.title.toLowerCase() === eventTitle.toLowerCase()
      );

      if (!alreadyExists) {
        generatedEvents.push({
          title: eventTitle,
          type: eventType,
          date: dateString,
          time: eventTime,
          confirmed: {},
          justifications: {},
          createdAt: Date.now()
        });
      }
    }
  }

  return generatedEvents;
}
