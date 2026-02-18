const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs-extra');

async function guide() {
    const { default: chalk } = await import('chalk');

    console.log('\n');
    logger.section('🚀 Autopilot Intelligent Guide');
    console.log(chalk.gray('Welcome! Let\'s get you up to speed with Autopilot CLI.\n'));

    const steps = [
        {
            title: '1. Initialization',
            desc: 'Set up your project with safety rails.',
            cmd: 'autopilot init',
            tip: 'This creates .autopilotrc.json and .autopilotignore.'
        },
        {
            title: '2. The Watcher',
            desc: 'Start the automation engine.',
            cmd: 'autopilot start',
            tip: 'Runs in the foreground. Press Ctrl+C to stop.'
        },
        {
            title: '3. Real-time Dashboard',
            desc: 'See exactly what Autopilot is doing.',
            cmd: 'autopilot dashboard',
            tip: 'Run this in a separate terminal split for the best experience.'
        },
        {
            title: '4. Productivity Insights',
            desc: 'Analyze your coding habits and quality.',
            cmd: 'autopilot insights',
            tip: 'Try "autopilot insights --export csv" for a detailed report.'
        },
        {
            title: '5. Global Leaderboard',
            desc: 'See where you rank among other developers.',
            cmd: 'autopilot leaderboard --sync',
            tip: 'Participation is opt-in and anonymized.'
        },
        {
            title: '6. Safety First: Undoing',
            desc: 'Made a mistake? Revert it instantly.',
            cmd: 'autopilot undo',
            tip: 'Keeps your file changes but removes the git commit.'
        }
    ];

    for (const step of steps) {
        console.log(chalk.bold.blue(`\n  ${step.title}`));
        console.log(`  ${chalk.white(step.desc)}`);
        console.log(`  ${chalk.bgBlack.green(' $ ' + step.cmd)}`);
        console.log(`  ${chalk.italic.gray(' Tip: ' + step.tip)}`);
    }

    console.log('\n');
    logger.info('Pro Tip: Run "autopilot doctor" if you encounter any environment issues.');
    console.log('\n');
}

module.exports = guide;
