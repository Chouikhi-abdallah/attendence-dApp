const fs = require('fs');
const path = require('path');

// Source contract file
const sourceContractPath = path.resolve(__dirname, 'build/contracts/Attendance.json');
// Target directory in the frontend
const targetDir = path.resolve(__dirname, 'attendance-frontend/src/contracts');
// Target path for the contract
const targetContractPath = path.resolve(targetDir, 'Attendance.json');

// Create the directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy the file
try {
  const contractData = fs.readFileSync(sourceContractPath, 'utf8');
  fs.writeFileSync(targetContractPath, contractData);
  console.log(`Contract ABI copied successfully to ${targetContractPath}`);
} catch (error) {
  console.error('Error copying contract ABI:', error);
}
