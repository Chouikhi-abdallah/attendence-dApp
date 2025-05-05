// Script to test role assignments
const Attendance = artifacts.require("Attendance");

module.exports = async function(callback) {
  try {
    // Get the deployed contract
    const attendance = await Attendance.deployed();
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const adminAccount = accounts[0];
    const teacherAccount = accounts[1];
    const studentAccount = accounts[2];
    
    console.log(`Admin account: ${adminAccount}`);
    console.log(`Teacher account: ${teacherAccount}`);
    console.log(`Student account: ${studentAccount}`);
    
    // Check admin
    const adminAddress = await attendance.admin();
    console.log(`Contract admin address: ${adminAddress}`);
    console.log(`Is admin === accounts[0]: ${adminAddress.toLowerCase() === adminAccount.toLowerCase()}`);
    
    // Check teacher status before adding
    const isTeacherBefore = await attendance.isTeacher(teacherAccount);
    console.log(`Is ${teacherAccount} a teacher BEFORE adding: ${isTeacherBefore}`);
    
    // Add teacher
    console.log(`Adding ${teacherAccount} as a teacher...`);
    await attendance.addTeacher(teacherAccount, { from: adminAccount });
    
    // Check teacher status after adding
    const isTeacherAfter = await attendance.isTeacher(teacherAccount);
    console.log(`Is ${teacherAccount} a teacher AFTER adding: ${isTeacherAfter}`);
    
    // Register student
    console.log(`Registering ${studentAccount} as a student...`);
    await attendance.registerStudent(studentAccount, { from: adminAccount });
    
    // Check student status
    const isStudent = await attendance.isStudent(studentAccount);
    console.log(`Is ${studentAccount} a student: ${isStudent}`);
    
    // Create a class with the teacher account
    console.log(`Creating a class with teacher ${teacherAccount}...`);
    await attendance.createClass("Test Class", { from: teacherAccount });
    
    console.log("Test completed successfully!");
    
  } catch (error) {
    console.error("Error during test:", error);
  }
  
  callback();
};
