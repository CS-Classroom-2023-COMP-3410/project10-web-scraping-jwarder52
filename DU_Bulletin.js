const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://bulletin.du.edu/undergraduate/majorsminorscoursedescriptions/traditionalbachelorsprogrammajorandminors/computerscience/#coursedescriptionstext';

async function scrapeCourses() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);
        let courses = [];

        $('div.courseblock').each((_, element) => {
            const courseTitleElem = $(element).find('.courseblocktitle strong'); // Extracting from <strong>
            const courseDescElem = $(element).find('.courseblockdesc');

            if (courseTitleElem.length > 0) {
                let titleText = courseTitleElem.text().trim().replace(/\s+/g, ' '); // Normalize spaces

                // Fix potential &nbsp; issues
                titleText = titleText.replace(/\u00A0/g, ' '); // Replace non-breaking spaces

                // Extract course code and title
                const match = titleText.match(/(COMP[-\s]\d{4})\s+(.*)/);
                if (match) {
                    const courseCode = match[1].replace(/\s/, '-'); // Normalize spacing (COMP 3000 → COMP-3000)
                    const courseTitle = match[2];

                    // Extract numeric course level
                    const courseNumber = parseInt(courseCode.split('-')[1], 10);

                    // Ensure 3000-level or higher
                    if (courseNumber >= 3000) {
                        // Check that "Prerequisites" is NOT mentioned
                        const courseDescText = courseDescElem.text().replace(/\s+/g, ' ').trim().toLowerCase();
                        if (!courseDescText.includes('prerequisite')) {
                            courses.push({ course: courseCode, title: courseTitle });
                        }
                    }
                }
            }
        });

        // Ensure results directory exists
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        // Save to JSON
        const filePath = path.join(resultsDir, 'bulletin.json');
        fs.writeFileSync(filePath, JSON.stringify({ courses }, null, 4));

        console.log(`✅ Scraped ${courses.length} courses and saved to ${filePath}`);
    } catch (error) {
        console.error('❌ Error scraping DU bulletin:', error);
    }
}

scrapeCourses();
