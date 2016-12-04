import mysql from 'promise-mysql'
import { buildCategoriesQuery } from './utils.js'

export const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'password',
  database: 'db',
})

export const query = q =>
  connection
    .then(conn => conn.query(q))

export const login = ({ username, password }) =>
  query(`SELECT UserType FROM USER WHERE username='${username}' AND password='${password}';`)

export const getUser = ({ username }) =>
  query(`SELECT * FROM USER WHERE username='${username}';`)

export const register = ({ username, email, password }) =>
  query(`INSERT INTO USER (Username, Password, Email, UserType) VALUES ('${username}', '${password}', '${email}', 'Student');`)

export const getCategories = () => query(`SELECT Name FROM Category;`)

export const getDesignations = () => query(`SELECT Name FROM Designation;`)

export const getMajors = () => query(`SELECT Name FROM Major;`)

export const getDepartments = () => query(`SELECT Name FROM Department;`)

export const editProfileInfo = ({ username }) => query(
  `SELECT Year, Major, Major.Dept_name as Department FROM User, Major
    WHERE User.Major = Major.Name AND User.Username = '${username}';`)

export const updateProfile = ({ username, major, year }) => query(
  `UPDATE User SET Major='${major}',Year='${year}' WHERE Username='${username}';`)

export const getApplicationsFromUser = ({ username }) => query(
  `SELECT DATE_FORMAT(Date,'%d-%m-%Y') AS Date, Project_name, Status FROM Apply
  WHERE Student_name='${username}'`
)

export const getProject = ({ name }) => query(
  `SELECT Name, Advisor_name, Advisor_email, Description, Estimated_num_students, Designation_name
  FROM Project
  WHERE Name='${name}'`
)

export const checkProjectStatus = ({ name, username }) => query(
  `SELECT Status FROM Apply
  WHERE Project_name='${name}' AND Student_name='${username}'`
)

export const getProjectCategories = ({ name }) => query(
  `SELECT Category_name FROM Project, Project_is_category
  WHERE Name = '${name}' AND Name=Project_name`
)

export const getProjectRequirements = ({ name }) => query(
  `SELECT Major_requirement, Year_requirement, Department_requirement FROM Project, Project_requirement
  WHERE Project.Name = '${name}' AND Project.Name=Project_requirement.name`
)

export const applyProject = ({ username, name }) => {
  let date = new Date()
	date = date.getUTCFullYear() + '-' +
    ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
    ('00' + date.getUTCDate()).slice(-2) + ' ' +
    ('00' + date.getUTCHours()).slice(-2) + ':' +
    ('00' + date.getUTCMinutes()).slice(-2) + ':' +
    ('00' + date.getUTCSeconds()).slice(-2);
  return query(
    `INSERT INTO Apply (Project_name, Student_name, Date, Status) VALUES (
    '${name}',
    '${username}',
    '${date}',
    'Pending');`
  )
}

export const getCourse = ({ name }) => query(
  `SELECT DISTINCT
    Course_number, Name, Instructor, Designation_name, Estimated_num_students
    FROM Course, Course_is_category WHERE Name='${name}'
    AND Name=Course_name;`
)

export const getCourseCategories = ({ name }) => query(
  `SELECT Category_name FROM Course, Course_is_category
  WHERE Name = '${name}' AND Name=Course_name`
)

export const search = (filters) => {
  const { type, major, year } = filters
  if (type === 'Course') {
    return searchCourse(filters)
  } else if (type === 'Project' || major || year) {
    return searchProject(filters)
  }
  return Promise.all([searchProject(filters), searchCourse(filters)])
    .then(([projects, courses]) => projects.concat(courses))
}

const searchCourse = ({ title, categories, designation }) => {
  return query(`SELECT DISTINCT Name FROM Course, Course_is_category
    WHERE Name=Course_name
    ${title ? `AND Name LIKE '%${title}%'` : ''}
    ${categories && categories.length > 0 ? 'AND ('+buildCategoriesQuery(categories)+')' : ''}
    ${designation ? `AND Designation_name='${designation}'` : ''}
  ;`).then(courses => {
    courses.forEach((course) => course.type = "Course")
    return courses
  }).catch(console.log)
}

const searchProject = ({ title, categories, designation, major, year }) => {
  return query(`SELECT DISTINCT Project.Name FROM Project, Project_is_category, Project_requirement
    WHERE Project.Name=Project_name AND Project.Name=Project_requirement.Name
    ${title ? `AND Project.Name LIKE '%${title}%'` : ''}
    ${major ? `AND Major_requirement='${major}'` : ''}
    ${year ? `AND Year_requirement='${year}'` : ''}
    ${categories && categories.length > 0 ? 'AND ('+buildCategoriesQuery(categories)+')' : ''}
  `).then(projects => {
    projects.forEach((project) => project.type = "Project")
    return projects
  })
}

