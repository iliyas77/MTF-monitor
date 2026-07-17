const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const TICKET_TXT = path.join(__dirname, '../../ticket.txt');
const TICKETS_MD = path.join(__dirname, '../../TICKETS.md');
const PROJECT_NUMBER = 1;
const PROJECT_OWNER = 'iliyas77';

function runCmd(cmd) {
    try {
        return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' }).trim();
    } catch (e) {
        console.error(`Error executing: ${cmd}`);
        console.error(e.stderr || e.message);
        process.exit(1);
    }
}

function checkGhAuth() {
    try {
        execSync('gh auth status', { stdio: 'pipe' });
    } catch (e) {
        console.error("❌ GitHub CLI (gh) is not authenticated. Please run 'gh auth login' in your terminal first.");
        process.exit(1);
    }
}

function parseNewTickets(content) {
    // Looks for blocks starting with ### [NEW]
    const newTicketsRegex = /### \[NEW\] (.*?)\n\*\*Status:\*\* (.*?)\n\*\*Description:\*\*\n([\s\S]*?)(?=\n### \[NEW\]|\n---|$)/g;
    const tickets = [];
    let match;
    
    while ((match = newTicketsRegex.exec(content)) !== null) {
        tickets.push({
            title: match[1].trim(),
            status: match[2].trim(),
            description: match[3].trim(),
            originalText: match[0]
        });
    }
    return tickets;
}

function pushNewTickets(tickets) {
    console.log(`Found ${tickets.length} new ticket(s) to push in ticket.txt.`);
    const synced = [];
    
    for (const t of tickets) {
        console.log(`\nPushing: ${t.title}...`);
        
        const tmpBody = path.join(__dirname, 'tmp-body.md');
        fs.writeFileSync(tmpBody, t.description);
        
        console.log('  Creating issue...');
        const issueUrl = runCmd(`gh issue create --title "${t.title}" --body-file "${tmpBody}"`);
        fs.unlinkSync(tmpBody);
        console.log(`  Created issue: ${issueUrl}`);
        
        const issueIdMatch = issueUrl.match(/\/issues\/(\d+)/);
        const issueId = issueIdMatch ? `#${issueIdMatch[1]}` : 'Unknown';
        
        console.log('  Adding to GitHub Project...');
        runCmd(`gh project item-add ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${issueUrl}"`);
        
        synced.push({
            ...t,
            id: issueId,
            url: issueUrl
        });
    }
    return synced;
}

function updateMarkdownFile(syncedTickets) {
    if (!fs.existsSync(TICKETS_MD)) return;
    
    let content = fs.readFileSync(TICKETS_MD, 'utf-8');
    
    let tableRows = '';
    for (const st of syncedTickets) {
        tableRows += `\n| ${st.id} | ${st.title} | ${st.status} | [Link](${st.url}) |`;
    }
    
    content += tableRows;
    
    fs.writeFileSync(TICKETS_MD, content);
    console.log('\n✅ TICKETS.md updated successfully with synced tickets!');
}

function main() {
    console.log('🚀 Starting GitHub Projects Sync...');
    checkGhAuth();
    
    if (!fs.existsSync(TICKET_TXT)) {
        console.log("No ticket.txt found. Nothing to sync.");
        return;
    }
    
    const content = fs.readFileSync(TICKET_TXT, 'utf-8');
    const newTickets = parseNewTickets(content);
    
    if (newTickets.length === 0) {
        console.log("No valid new tickets found in ticket.txt to push.");
        return;
    }
    
    const synced = pushNewTickets(newTickets);
    updateMarkdownFile(synced);
    
    // Empty ticket.txt after successful sync
    fs.writeFileSync(TICKET_TXT, '');
    console.log('✅ ticket.txt has been cleared.');
}

main();
