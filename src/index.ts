import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

dotenv.config();

const serviceUrl = process.env.MY_SERVICE_URL || '';
const locationId = process.env.MY_LOCATION_ID || '';
const expectedStreet = process.env.MY_EXPECTED_STREET || '';


function parseGermanDate(dateStr: string): Date | null {
  // Example: "Do 09.01.25 *"
  // Strip any trailing asterisk:
  const cleanString = dateStr.replace('*', '').trim(); // => "Do 09.01.25"

  // Split by spaces => ["Do", "09.01.25"]
  const parts = cleanString.split(/\s+/);
  if (parts.length < 2) {
    return null;
  }

  // "09.01.25"
  const datePart = parts[1];
  const [day, month, yearShort] = datePart.split('.');
  if (!day || !month || !yearShort) {
    return null;
  }

  const dayNum = parseInt(day, 10);
  // Months are zero-based in JS
  const monthNum = parseInt(month, 10) - 1;
  // We assume "25" => 2025
  const yearFull = 2000 + parseInt(yearShort, 10);

  return new Date(yearFull, monthNum, dayNum);
}

async function checkTrashCollection(): Promise<void> {
  const url = `${serviceUrl}${locationId}`;


  try {
    // 1) Fetch the HTML
    const response = await axios.get(url);
    const html = response.data;

    // 2) Load into Cheerio
    const $ = cheerio.load(html);

    // 3) Verify the street name
    const actualStreet = $('#strasse').text().trim();
    if (actualStreet !== expectedStreet) {
      console.warn(
        `WARNING: Street name mismatch. Expected "${expectedStreet}" but got "${actualStreet}". The website structure may have changed.`
      );
      return;
    } else {
      console.log(`Street name is correct: "${actualStreet}"`);
    }

    // 4) Collect all upcoming events
    const upcoming: { date: Date; type: string }[] = [];

    // Each table: .rest, .bio, .papier, .gs
    $('#termine .row .col-6 table').each((_, table) => {
      // The category name is in thead > tr > th
      const categoryName = $(table).find('thead tr th').text().trim();

      // Each row in tbody
      $(table)
        .find('tbody tr')
        .each((__, row) => {
          const cellText = $(row).find('td').text().trim(); 
          // e.g., "Do 09.01.25 *" or "&nbsp;"
          if (!cellText || cellText === '\u00a0') {
            return; // skip empty or whitespace rows
          }

          const parsedDate = parseGermanDate(cellText);
          if (parsedDate) {
            upcoming.push({ date: parsedDate, type: categoryName });
          }
        });
    });

    if (upcoming.length === 0) {
      console.log('No dates found, or structure might have changed.');
      return;
    }

    // 5) Filter: keep only the dates within the next 8 days (including today)
    const today = new Date(); // e.g., 2025-01-19T(…time…)
    // "Floor" this to ignore time part if you want pure day-based comparison:
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // We add +7 to get an 8-day window (day 1 = today, day 8 = today+7)
    const limitDate = new Date(startOfToday.getTime());
    limitDate.setDate(limitDate.getDate() + 7);

    // Filter events: parsedDate is >= startOfToday and <= limitDate
    const nextEightDays = upcoming.filter(
      (item) => item.date >= startOfToday && item.date <= limitDate
    );

    if (nextEightDays.length === 0) {
      console.log('No pickups in the next 8 days (including today).');
      return;
    }

    // 6) Sort the filtered list ascending by date
    nextEightDays.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 7) Output them
    console.log('\nPickup(s) in the next 8 days (including today):');
    nextEightDays.forEach((pickup) => {
      // "de-DE" for German format, adapt as needed
      const dateStr = pickup.date.toLocaleDateString('de-DE', {
        weekday: 'short', // e.g. "Mi" or "Do"
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
      console.log(`  - ${pickup.type}: ${dateStr}`);
    });
  } catch (error) {
    console.error('Error fetching or parsing data:', error);
  }
}

// Run it
checkTrashCollection();
