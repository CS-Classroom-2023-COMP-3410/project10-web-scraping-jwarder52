const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://denverpioneers.com';
const sportPaths = [
    'mbball',   // Men's Basketball
    'wbball',   // Women's Basketball
    'mgolf',    // Men's Golf
    'wgolf',    // Women's Golf
    'wgym',     // Women's Gymnastics
    'mhockey',  // Men's Hockey
    'mlax',     // Men's Lacrosse
    'wlax',     // Women's Lacrosse
    'skiing',   // Skiing
    'msoc',     // Men's Soccer
    'wsoc',     // Women's Soccer
    'mswim',    // Men's Swimming & Diving
    'wswim',    // Women's Swimming & Diving
    'mten',     // Men's Tennis
    'wten',     // Women's Tennis
    'wtri',     // Women's Triathlon
    'wvball'    // Women's Volleyball
  ];
  

async function fetchSchedules() {
    const events = [];

    try {
        for (const path of sportPaths) {
            const url = `${BASE_URL}/schedule.aspx?path=${path}`;
            console.log(`🔄 Fetching schedule from ${url}`);

            const { data: html } = await axios.get(url);
            const $ = cheerio.load(html);

            $('.sidearm-schedule-game').each((_, el) => {
                const opponent = $(el).find('.sidearm-schedule-game-opponent-name').text().trim();
                const date = $(el).find('.sidearm-schedule-game-opponent-date').text().trim();
                const time = $(el).find('.sidearm-schedule-game-time').text().trim();

                if (opponent && date) {
                    events.push({
                        duTeam: path.toUpperCase(),
                        opponent,
                        date,
                        time: time || undefined
                    });
                }
            });
        }

        fs.mkdirSync('results', { recursive: true });
        fs.writeFileSync('results/athletic_events.json', JSON.stringify({ events }, null, 4));

        console.log(`✅ Saved ${events.length} events to results/athletic_events.json`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fetchSchedules();
