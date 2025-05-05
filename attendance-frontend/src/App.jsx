/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import Blockchain from "./Blockchain";
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Nav,
  Navbar,
  Alert,
  Spinner,
  Badge,
  Tab,
  Tabs,
  ListGroup,
  Modal
} from "react-bootstrap";
import {
  PersonPlus,
  Book,
  CheckCircle,
  People,
  Calendar,
  House,
  Person,
  Award,
  Clipboard
} from "react-bootstrap-icons";

function App() {
  // Blockchain state
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractFunctions, setContractFunctions] = useState([]);
  const [contractAddress, setContractAddress] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("dashboard");

  // Admin state
  const [newTeacherAddress, setNewTeacherAddress] = useState("");
  const [newStudentAddress, setNewStudentAddress] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
  const [isLoadingAllRecords, setIsLoadingAllRecords] = useState(false);

  // Teacher state
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [newClassName, setNewClassName] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [studentToEnroll, setStudentToEnroll] = useState("");
  const [studentToMark, setStudentToMark] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("present");

  // Student state
  const [studentClasses, setStudentClasses] = useState([]);
  const [selectedStudentClass, setSelectedStudentClass] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  // Convert date to timestamp
  const dateToTimestamp = (dateString) => {
    return Math.floor(new Date(dateString).getTime() / 1000);
  };

  useEffect(() => {
    let isComponentMounted = true;
    
    const init = async () => {
      try {
        setLoading(true);
        const blockchainData = await Blockchain();
        if (!isComponentMounted) return;
        
        setWeb3(blockchainData.web3);
        setContract(blockchainData.contract);
        
        // Debug contract info
        if (blockchainData.contract) {
          console.log("Contract methods:", blockchainData.contract.methods);
          setContractFunctions(Object.keys(blockchainData.contract.methods));
          console.log("Contract address:", blockchainData.contract._address);
          setContractAddress(blockchainData.contract._address);
        }

        // Get user account from Metamask
        const accounts = await blockchainData.web3.eth.getAccounts();
        const userAccount = accounts[0];
        console.log("Connected account:", userAccount);
        setAccount(userAccount);

        // Clear previous role state
        setIsAdmin(false);
        setIsTeacher(false);
        setIsStudent(false);
        
        try {
          // Check user roles - using try/catch for each individual call
          console.log("Calling admin() function...");
          const adminAddress = await blockchainData.contract.methods.admin().call();
          console.log("Admin address:", adminAddress);
          const isUserAdmin = adminAddress.toLowerCase() === userAccount.toLowerCase();
          if (isComponentMounted) setIsAdmin(isUserAdmin);
          console.log("Is admin:", isUserAdmin);

          console.log("Calling isTeacher() function...");
          const teacherStatus = await blockchainData.contract.methods.isTeacher(userAccount).call();
          console.log("Teacher status:", teacherStatus);
          if (isComponentMounted) setIsTeacher(teacherStatus);

          console.log("Calling isStudent() function...");
          const studentStatus = await blockchainData.contract.methods.isStudent(userAccount).call();
          console.log("Student status:", studentStatus);
          if (isComponentMounted) setIsStudent(studentStatus);
          
          // Force active tab update based on actual role
          if (isUserAdmin) {
            if (isComponentMounted) setActiveTab("admin");
            console.log("Setting active tab to: admin");
          } else if (teacherStatus) {
            if (isComponentMounted) setActiveTab("teacher");
            console.log("Setting active tab to: teacher");
            if (isComponentMounted) await loadTeacherClasses(blockchainData.contract, userAccount);
          } else if (studentStatus) {
            if (isComponentMounted) setActiveTab("student");
            console.log("Setting active tab to: student");
            if (isComponentMounted) await loadStudentClasses(blockchainData.contract, userAccount);
          } else {
            if (isComponentMounted) setActiveTab("dashboard");
            console.log("Setting active tab to: dashboard (no specific role)");
          }
          
        } catch (callError) {
          console.error("Error during contract function calls:", callError);
          if (isComponentMounted) setError("Contract interaction error: " + callError.message);
        }

        if (isComponentMounted) setLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        if (isComponentMounted) {
          setError(err.message || "Failed to initialize the application");
          setLoading(false);
        }
      }
    };

    init();
    
    // Setup MetaMask account change listener directly in this component
    const handleAccountsChanged = async (accounts) => {
      console.log("Account changed in App component", accounts);
      if (accounts.length > 0) {
        window.location.reload(true);
      }
    };
    
    if (window.ethereum) {
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    return () => {
      isComponentMounted = false;
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Load teacher's classes
  const loadTeacherClasses = async (contractInstance, teacherAddress) => {
    try {
      const classIds = await contractInstance.methods.getTeacherClasses(teacherAddress).call();
      const classes = [];
      
      for (const classId of classIds) {
        const classInfo = await contractInstance.methods.getClassInfo(classId).call();
        classes.push(classInfo);
      }
      
      setTeacherClasses(classes);
    } catch (err) {
      console.error("Error loading teacher classes:", err);
    }
  };

  // Load student's classes
  const loadStudentClasses = async (contractInstance, studentAddress) => {
    try {
      const classIds = await contractInstance.methods.getStudentClasses(studentAddress).call();
      const classes = [];
      
      for (const classId of classIds) {
        const classInfo = await contractInstance.methods.getClassInfo(classId).call();
        classes.push(classInfo);
      }
      
      setStudentClasses(classes);
    } catch (err) {
      console.error("Error loading student classes:", err);
    }
  };

  // Admin functions
  const addTeacher = async () => {
    try {
      await contract.methods.addTeacher(newTeacherAddress).send({ from: account });
      alert(`Teacher ${newTeacherAddress} added successfully!`);
      setNewTeacherAddress("");
    } catch (err) {
      console.error("Error adding teacher:", err);
      alert(`Error adding teacher: ${err.message}`);
    }
  };

  const registerStudent = async () => {
    try {
      await contract.methods.registerStudent(newStudentAddress).send({ from: account });
      alert(`Student ${newStudentAddress} registered successfully!`);
      setNewStudentAddress("");
    } catch (err) {
      console.error("Error registering student:", err);
      alert(`Error registering student: ${err.message}`);
    }
  };
  
  const fetchAllClasses = async () => {
    try {
      const classCount = await contract.methods.classCount().call();
      const classes = [];
      
      for (let i = 0; i < classCount; i++) {
        const classInfo = await contract.methods.getClassInfo(i).call();
        if (classInfo.isActive) {
          classes.push(classInfo);
        }
      }
      
      setAllClasses(classes);
      return classes;
    } catch (err) {
      console.error("Error fetching all classes:", err);
      return [];
    }
  };
  
  const fetchAllStudents = async () => {
    try {
      // This is a simulated approach since we don't have a way to get all students directly
      // In a real application, we would have this data stored or indexed
      // For now, we'll use transaction events to identify registered students
      const latestBlock = await web3.eth.getBlockNumber();
      const events = await contract.getPastEvents('StudentRegistered', {
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      const studentAddresses = events.map(event => event.returnValues.student);
      setAllStudents(studentAddresses);
      return studentAddresses;
    } catch (err) {
      console.error("Error fetching all students:", err);
      return [];
    }
  };
  
  const fetchAllAttendanceRecords = async () => {
    setIsLoadingAllRecords(true);
    try {
      const classes = await fetchAllClasses();
      const students = await fetchAllStudents();
      
      const allRecords = [];
      
      for (const student of students) {
        for (const classInfo of classes) {
          try {
            const records = await contract.methods.getStudentAttendance(student, classInfo.id).call();
            
            for (const record of records) {
              allRecords.push({
                student,
                className: classInfo.name,
                classId: classInfo.id,
                date: record.date,
                status: record.status,
                present: record.present
              });
            }
          } catch (err) {
            console.error(`Error fetching attendance for student ${student} in class ${classInfo.id}:`, err);
          }
        }
      }
      
      setAllAttendanceRecords(allRecords);
      setIsLoadingAllRecords(false);
    } catch (err) {
      console.error("Error fetching all attendance records:", err);
      setIsLoadingAllRecords(false);
    }
  };

  // Teacher functions
  const createClass = async () => {
    try {
      await contract.methods.createClass(newClassName).send({ from: account });
      alert(`Class "${newClassName}" created successfully!`);
      setNewClassName("");
      loadTeacherClasses(contract, account);
    } catch (err) {
      console.error("Error creating class:", err);
      alert(`Error creating class: ${err.message}`);
    }
  };

  const enrollStudent = async () => {
    if (!selectedClass) {
      alert("Please select a class first");
      return;
    }

    try {
      await contract.methods.enrollStudentInClass(studentToEnroll, selectedClass.id)
        .send({ from: account });
      alert(`Student ${studentToEnroll} enrolled in ${selectedClass.name} successfully!`);
      setStudentToEnroll("");
    } catch (err) {
      console.error("Error enrolling student:", err);
      alert(`Error enrolling student: ${err.message}`);
    }
  };

  const markAttendance = async () => {
    if (!selectedClass) {
      alert("Please select a class first");
      return;
    }

    if (!attendanceDate) {
      alert("Please select a date");
      return;
    }

    try {
      const timestamp = dateToTimestamp(attendanceDate);
      await contract.methods.markAttendance(
        studentToMark,
        selectedClass.id,
        timestamp,
        attendanceStatus
      ).send({ from: account });
      
      alert(`Attendance for student ${studentToMark} marked as ${attendanceStatus}!`);
      setStudentToMark("");
      setAttendanceDate("");
      setAttendanceStatus("present");
    } catch (err) {
      console.error("Error marking attendance:", err);
      alert(`Error marking attendance: ${err.message}`);
    }
  };

  // Student functions
  const viewAttendance = async (classId) => {
    try {
      const records = await contract.methods.getStudentAttendance(account, classId).call();
      setStudentAttendance(records);
      setSelectedStudentClass(classId);
    } catch (err) {
      console.error("Error viewing attendance:", err);
      alert(`Error viewing attendance: ${err.message}`);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Card className="text-center p-4">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <Card.Title>Loading...</Card.Title>
          <Card.Text>Connecting to the blockchain</Card.Text>
        </Card>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          
          <hr />
          <div className="mb-3">
            <h5>Debug Information</h5>
            <p><strong>Connected Account:</strong> {account || 'Not connected'}</p>
            <p><strong>Contract Address:</strong> {contractAddress || 'Not available'}</p>
            
            <div className="mt-3">
              <h6>Available Contract Functions:</h6>
              <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {contractFunctions.map((func, index) => (
                  <ListGroup.Item key={index} className="font-monospace">{func}</ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </div>
          
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Alert>
      </Container>
    );
  }

  // Render not connected state
  if (!account) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Card className="text-center p-4" style={{ width: '400px' }}>
          <Card.Title>Not Connected</Card.Title>
          <Card.Text className="mb-4">
            Please connect your MetaMask wallet to use this application
          </Card.Text>
          <Button onClick={() => window.location.reload()}>Connect Wallet</Button>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#">
            <Award className="me-2" /> Attendance dApp
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
                <House className="me-1" /> Dashboard
              </Nav.Link>
              {isAdmin && (
                <Nav.Link active={activeTab === "admin"} onClick={() => setActiveTab("admin")}>
                  <Person className="me-1" /> Admin Panel
                </Nav.Link>
              )}
              {isTeacher && (
                <Nav.Link active={activeTab === "teacher"} onClick={() => setActiveTab("teacher")}>
                  <Person className="me-1" /> Teacher Panel
                </Nav.Link>
              )}
              {isStudent && (
                <Nav.Link active={activeTab === "student"} onClick={() => setActiveTab("student")}>
                  <Person className="me-1" /> Student Portal
                </Nav.Link>
              )}
            </Nav>
            <Nav>
              <Navbar.Text className="me-3">
                Connected as: {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </Navbar.Text>
              {isAdmin && <Badge bg="danger" className="me-1">Admin</Badge>}
              {isTeacher && <Badge bg="primary" className="me-1">Teacher</Badge>}
              {isStudent && <Badge bg="success">Student</Badge>}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mb-5">
        {/* Dashboard Panel */}
        {activeTab === "dashboard" && (
          <>
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                    <Card.Title>Welcome to Attendance dApp</Card.Title>
                    <Card.Text>
                      A decentralized application for managing class attendance using Ethereum blockchain
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                    <Card.Title>Account Information</Card.Title>
                    <Card.Text>
                      <strong>Your Address:</strong> {account}
                    </Card.Text>
                    <div className="d-flex gap-2 mb-3">
                      <Badge bg={isAdmin ? "danger" : "secondary"}>
                        Admin: {isAdmin ? "Yes" : "No"}
                      </Badge>
                      <Badge bg={isTeacher ? "primary" : "secondary"}>
                        Teacher: {isTeacher ? "Yes" : "No"}
                      </Badge>
                      <Badge bg={isStudent ? "success" : "secondary"}>
                        Student: {isStudent ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <Button variant="outline-secondary" onClick={() => window.location.reload(true)}>
                      Refresh Roles
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>
                      <CheckCircle className="me-2" /> Secure Tracking
                    </Card.Title>
                    <Card.Text>
                      All attendance records are stored on the Ethereum blockchain, ensuring they cannot be tampered with.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>
                      <People className="me-2" /> Role-Based Access
                    </Card.Title>
                    <Card.Text>
                      Different interfaces for administrators, teachers, and students with appropriate permissions.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>
                      <Clipboard className="me-2" /> Transparent Records
                    </Card.Title>
                    <Card.Text>
                      Students can verify their own attendance history at any time.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Admin Panel */}
        {activeTab === "admin" && (
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>
                    <PersonPlus className="me-2" /> Add Teacher
                  </Card.Title>
                  <Form.Group className="mb-3">
                    <Form.Label>Teacher Ethereum Address:</Form.Label>
                    <Form.Control
                      type="text"
                      value={newTeacherAddress}
                      onChange={(e) => setNewTeacherAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </Form.Group>
                  <Button onClick={addTeacher}>Add Teacher</Button>
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>
                    <PersonPlus className="me-2" /> Register Student
                  </Card.Title>
                  <Form.Group className="mb-3">
                    <Form.Label>Student Ethereum Address:</Form.Label>
                    <Form.Control
                      type="text"
                      value={newStudentAddress}
                      onChange={(e) => setNewStudentAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </Form.Group>
                  <Button onClick={registerStudent}>Register Student</Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>
                    <Clipboard className="me-2" /> All Attendance Records
                  </Card.Title>
                  <p>View attendance records across all classes and students.</p>
                  <Button
                    onClick={fetchAllAttendanceRecords}
                    disabled={isLoadingAllRecords}
                    className="mb-3"
                  >
                    {isLoadingAllRecords ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      "Fetch All Records"
                    )}
                  </Button>

                  {allAttendanceRecords.length > 0 ? (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allAttendanceRecords.map((record, index) => (
                            <tr key={index}>
                              <td title={record.student}>
                                {record.student.substring(0, 6)}...{record.student.substring(record.student.length - 4)}
                              </td>
                              <td>{record.className}</td>
                              <td>{formatDate(record.date)}</td>
                              <td>
                                <Badge bg={record.status === "present" ? "success" : record.status === "absent" ? "danger" : "warning"}>
                                  {record.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : isLoadingAllRecords ? (
                    <div className="text-center my-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <Alert variant="info">
                      No attendance records found. Add some classes and mark attendance first.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Teacher Panel */}
        {activeTab === "teacher" && (
          <Row>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>
                    <Book className="me-2" /> Create New Class
                  </Card.Title>
                  <Form.Group className="mb-3">
                    <Form.Label>Class Name:</Form.Label>
                    <Form.Control
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="e.g., Mathematics 101"
                    />
                  </Form.Group>
                  <Button onClick={createClass}>Create Class</Button>
                </Card.Body>
              </Card>

              {teacherClasses.length > 0 && (
                <Card className="mb-4">
                  <Card.Body>
                    <Card.Title>Your Classes</Card.Title>
                    <ListGroup variant="flush">
                      {teacherClasses.map((classItem) => (
                        <ListGroup.Item
                          key={classItem.id}
                          action
                          active={selectedClass && selectedClass.id === classItem.id}
                          onClick={() => setSelectedClass(classItem)}
                        >
                          <div className="fw-bold">{classItem.name}</div>
                          <small>Class ID: {classItem.id}</small>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              )}
            </Col>

            <Col md={8}>
              {selectedClass && (
                <>
                  <Card className="mb-4">
                    <Card.Body>
                      <Card.Title>
                        Enroll Student in {selectedClass.name}
                      </Card.Title>
                      <Form.Group className="mb-3">
                        <Form.Label>Student Address:</Form.Label>
                        <Form.Control
                          type="text"
                          value={studentToEnroll}
                          onChange={(e) => setStudentToEnroll(e.target.value)}
                          placeholder="0x..."
                        />
                      </Form.Group>
                      <Button onClick={enrollStudent}>Enroll Student</Button>
                    </Card.Body>
                  </Card>

                  <Card>
                    <Card.Body>
                      <Card.Title>
                        Mark Attendance for {selectedClass.name}
                      </Card.Title>
                      <Form.Group className="mb-3">
                        <Form.Label>Student Address:</Form.Label>
                        <Form.Control
                          type="text"
                          value={studentToMark}
                          onChange={(e) => setStudentToMark(e.target.value)}
                          placeholder="0x..."
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Date:</Form.Label>
                        <Form.Control
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Status:</Form.Label>
                        <Form.Select
                          value={attendanceStatus}
                          onChange={(e) => setAttendanceStatus(e.target.value)}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                        </Form.Select>
                      </Form.Group>
                      <Button onClick={markAttendance}>Mark Attendance</Button>
                    </Card.Body>
                  </Card>
                </>
              )}
            </Col>
          </Row>
        )}

        {/* Student Panel */}
        {activeTab === "student" && (
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>Your Classes</Card.Title>
                  {studentClasses.length > 0 ? (
                    <ListGroup>
                      {studentClasses.map((classItem) => (
                        <ListGroup.Item
                          key={classItem.id}
                          action
                          onClick={() => viewAttendance(classItem.id)}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-bold">{classItem.name}</div>
                              <small className="text-muted">
                                Teacher: {classItem.teacher.substring(0, 6)}...{classItem.teacher.substring(classItem.teacher.length - 4)}
                              </small>
                            </div>
                            <Button size="sm" variant="outline-primary">
                              View Attendance
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <Alert variant="info">
                      You are not enrolled in any classes yet.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              {studentAttendance.length > 0 ? (
                <Card>
                  <Card.Body>
                    <Card.Title>Attendance Records</Card.Title>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAttendance.map((record, index) => (
                          <tr key={index}>
                            <td>{formatDate(record.date)}</td>
                            <td>
                              <Badge bg={record.status === "present" ? "success" : record.status === "absent" ? "danger" : "warning"}>
                                {record.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              ) : selectedStudentClass !== null && (
                <Card>
                  <Card.Body>
                    <Alert variant="info">
                      There are no attendance records for this class yet.
                    </Alert>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        )}
      </Container>

      
    </>
  );
}

export default App;
