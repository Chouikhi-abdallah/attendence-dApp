// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Attendance {
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    // Role management
    mapping(address => bool) public isTeacher;
    mapping(address => bool) public isStudent;

    // Class management
    struct Class {
        string name;
        uint256 id;
        address teacher;
        bool isActive;
    }
    
    uint256 public classCount = 0;
    mapping(uint256 => Class) public classes;
    mapping(address => uint256[]) public teacherClasses;
    mapping(address => uint256[]) public studentClasses;

    // Attendance management
    struct Record {
        uint256 date;
        uint256 classId;
        bool present;
        string status; // 'present', 'absent', 'excused'
    }

    // Nested mapping: student -> classId -> records
    mapping(address => mapping(uint256 => Record[])) public attendanceRecords;
    
    // Events
    event TeacherAdded(address teacher);
    event StudentRegistered(address student);
    event ClassCreated(uint256 classId, string name, address teacher);
    event AttendanceMarked(address student, uint256 classId, uint256 date, string status);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyTeacher() {
        require(isTeacher[msg.sender], "Only teachers can perform this action");
        _;
    }

    modifier onlyTeacherOfClass(uint256 _classId) {
        require(isTeacher[msg.sender], "Only teachers can perform this action");
        require(classes[_classId].teacher == msg.sender, "You are not the teacher of this class");
        _;
    }

    // Role management functions
    function addTeacher(address _teacher) public onlyAdmin {
        isTeacher[_teacher] = true;
        emit TeacherAdded(_teacher);
    }

    function removeTeacher(address _teacher) public onlyAdmin {
        isTeacher[_teacher] = false;
    }

    function registerStudent(address _student) public onlyAdmin {
        isStudent[_student] = true;
        emit StudentRegistered(_student);
    }

    // Class management functions
    function createClass(string memory _name) public onlyTeacher returns (uint256) {
        uint256 classId = classCount++;
        classes[classId] = Class(_name, classId, msg.sender, true);
        teacherClasses[msg.sender].push(classId);
        emit ClassCreated(classId, _name, msg.sender);
        return classId;
    }

    function enrollStudentInClass(address _student, uint256 _classId) public onlyTeacherOfClass(_classId) {
        require(isStudent[_student], "Address is not a registered student");
        studentClasses[_student].push(_classId);
    }

    // Attendance functions
    function markAttendance(address _student, uint256 _classId, uint256 _date, string memory _status) public onlyTeacherOfClass(_classId) {
        require(bytes(_status).length > 0, "Status cannot be empty");
        require(isStudent[_student], "Address is not a registered student");

        bool isPresent = keccak256(abi.encodePacked(_status)) == keccak256(abi.encodePacked("present"));
        
        attendanceRecords[_student][_classId].push(
            Record(_date, _classId, isPresent, _status)
        );
        
        emit AttendanceMarked(_student, _classId, _date, _status);
    }

    // View functions
    function getStudentAttendance(address _student, uint256 _classId) public view returns (Record[] memory) {
        return attendanceRecords[_student][_classId];
    }

    function getTeacherClasses(address _teacher) public view returns (uint256[] memory) {
        return teacherClasses[_teacher];
    }

    function getStudentClasses(address _student) public view returns (uint256[] memory) {
        return studentClasses[_student];
    }

    function getClassInfo(uint256 _classId) public view returns (Class memory) {
        return classes[_classId];
    }
}
