#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

// Function to run a command and handle errors
function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Main build process
async function build() {
  console.log('Starting build process...');
  
  // TypeScript check (but continue even if it fails)
  try {
    execSync('tsc --noEmit', { stdio: 'inherit' });
    console.log('TypeScript check passed!');
  } catch (error) {
    console.warn('TypeScript check failed, but continuing with build...');
    console.warn(error.message);
  }
  
  // Run Vite build
  const buildSuccess = runCommand('vite build');
  
  if (!buildSuccess) {
    console.error('Build failed!');
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
}

// Run the build
build().catch(error => {
  console.error('Unhandled error during build:');
  console.error(error);
  process.exit(1); 
}); 