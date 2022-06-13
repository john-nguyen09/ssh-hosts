#!/usr/bin/env node

const inquirer = require('inquirer');
const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const file = path.join(process.env.HOME, '.ssh', 'config');
const pattern = /\s*Host\s+(.*)\s*/g;

function onExit(childProcess) {
    return new Promise((resolve, reject) => {
        childProcess.once('exit', (code, signal) => {
            if (code === 0) {
                resolve(undefined);
            } else {
                reject(new Error('Exit with error code: '+code));
            }
        });
        childProcess.once('error', (err) => {
                reject(err);
        });
    });
}

async function main() {
    const content = (await fs.readFile(file)).toString()
    const matches = content.matchAll(pattern);
    const hosts = [];

    for (const match of matches) {
        hosts.push(match[1]);
    }

    const answers = await inquirer.prompt([
        {
            type: 'list',
            choices: [
                'Exit',
                ...hosts,
            ],
            name: 'Choose host',
        }
    ]);
    const host = answers['Choose host'];

    if (!hosts.includes(host)) {
        return;
    }

    try {
        const cp = spawn(`ssh`, [
            host,
        ], {
            stdio: [process.stdin, process.stdout, process.stderr],
        });
        await onExit(cp);
    } catch (err) {
        console.error(err);
    }
}

main();
