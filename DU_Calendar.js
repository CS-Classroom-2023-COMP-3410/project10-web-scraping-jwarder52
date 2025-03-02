const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.du.edu';
const CALENDAR_URL = 'https://www.du.edu/calendar?search=&start_date=2025-01-01&end_date=2025-12-31';

async function scrapeCalendar() {
    try {
        const events = [];
        const { data: html } = await axios.get(CALENDAR_URL);
        const $ = cheerio.load(html);

        const eventElements = $('.events-listing__item');

        console.log(`🔎 Found ${eventElements.length} events.`);

        for (const element of eventElements) {
            const eventTitle = $(element).find('h3').text().trim();
            const eventDate = $(element).find('p').first().text().trim();
            const eventTime = $(element).find('.icon-du-clock').parent().text().replace('icon-du-clock', '').trim();
            const detailsLink = $(element).find('a.event-card').attr('href');

            let description;
            if (detailsLink) {
                try {
                    const detailsURL = detailsLink.startsWith('http') ? detailsLink : `${BASE_URL}${detailsLink}`;
                    const { data: detailsHtml } = await axios.get(detailsURL);
                    const $$ = cheerio.load(detailsHtml);

                    description = $$('.event-detail__description').text().trim() || undefined;
                } catch (err) {
                    console.warn(`⚠️ Could not fetch description for ${eventTitle}: ${err.message}`);
                }
            }

            const event = {
                title: eventTitle,
                date: eventDate,
            };

            if (eventTime) event.time = eventTime;
            if (description) event.description = description;

            events.push(event);
        }

        fs.mkdirSync('results', { recursive: true });
        fs.writeFileSync(
            path.join('results', 'calendar_events.json'),
            JSON.stringify({ events }, null, 4)
        );

        console.log(`✅ Saved ${events.length} events to results/calendar_events.json`);
    } catch (error) {
        console.error('❌ Error scraping calendar:', error.message);
    }
}

scrapeCalendar();
