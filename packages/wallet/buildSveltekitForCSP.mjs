/* eslint-disable @typescript-eslint/no-var-requires */


import fs from 'fs';
import { load } from 'cheerio';
import path from 'path';

// Base directory
const baseDir = './build';

// Recursive function to get all HTML files in a directory and its subdirectories
function getHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            // Recurse into subdirectory
            results = results.concat(getHtmlFiles(file));
        } else if (path.extname(file) === '.html') {
            // Add HTML file to results
            results.push(file);
        }
    });
    return results;
}

// Get all HTML files
const htmlFilePaths = getHtmlFiles(baseDir);

// Process each HTML file
htmlFilePaths.forEach(htmlFilePath => {
    // Read the HTML file
    const html = fs.readFileSync(htmlFilePath, 'utf-8');

    // Load the HTML into cheerio
    const $ = load(html);

    // Find the script tag, get its contents, and remove it
    $('script').each((i, script) => {
        let content = $(script).html();
        if (content.trim() !== '' && content.includes('__sveltekit_')) {
            // Remove the first '{' and last '}'
            content = content.trim();
            content = content.substring(1, content.length - 1).trim();

            // Extract the base name of the HTML file and replace its extension with .js
            const newJsFileName = path.basename(htmlFilePath, '.html') + '.js';
            const newJsFilePath = path.join(path.dirname(htmlFilePath), newJsFileName);

            // Create a new JavaScript file and write the script contents into it
            fs.writeFileSync(newJsFilePath, content);

            // Clear the content of the script tag and update its src attribute to reference the new JavaScript file
            $(script).html('').attr('src', newJsFileName);
        }
    });

    // Write the modified HTML back to the file
    fs.writeFileSync(htmlFilePath, $.html());
});
