import { query } from './db.js'

export const getApplications = () => query(
  `SELECT Project_name, Status, Major, Year, Student_name FROM Apply, User WHERE Student_name = Username;`
)

export const setApplicationStatus = ({ status, student, project }) =>
  query(`UPDATE Apply SET Status='${status}'
    WHERE Project_name='${project}' AND Student_name='${student}';`)

export const popularProjects = () =>
  query(`(SELECT Project_name, COUNT(*) AS Num_applicants FROM Apply
    GROUP BY Project_name) ORDER BY Num_applicants Desc LIMIT 10;`)

export const addProject = ({
  name, advisor, advisor_email, desc, categories,
  designation, est, major, year, department
}) => {
  const p = Promise.resolve('')
  return query(`INSERT INTO Project
    (Name, Description, Advisor_email, Advisor_name, Estimated_num_students, Designation_name) VALUES
    ('${name}', '${mysqlEscapeString(desc)}', '${advisor_email}', '${advisor}', '${est}', '${designation}');`)
    .then(a => {
      const categoryQueries = categories && categories.length > 0 ?
        categories.map(category =>
          query(`INSERT INTO Project_is_category
          (Project_name, Category_name) VALUES
          ('${name}', '${category}')`))
        : []
      const queries = [
        (major || year || department) ? query(`INSERT INTO Project_requirement
          (Name, Major_requirement, Year_requirement, Department_requirement) VALUES
          ('${name}', '${major}', '${year}', '${department}');`) : p
      ].concat(categoryQueries)
      return Promise.all(queries)
    })
}

export const addCourse = ({
  name, number, instructor, designation, categories, est
}) => {
  const p = Promise.resolve('')
  return query(`INSERT INTO Course
    (Name, Course_number, Instructor, Estimated_num_students, Designation_name) VALUES
    ('${name}', '${number}', '${instructor}', '${est}', '${designation}');`)
    .then(a => {
      const categoryQueries = categories && categories.length > 0 ?
        categories.map(category =>
          query(`INSERT INTO Course_is_category
          (Course_name, Category_name) VALUES
          ('${name}', '${category}')`))
        : []
      return categoryQueries
    })
}

export const appReport = () => {
  return query(`
		SELECT Name,
    (SELECT COUNT(*) FROM Apply WHERE Apply.Project_name=Name)
    AS Num_applicants,
    CONCAT(FORMAT((SELECT COUNT(*) FROM Apply WHERE Apply.Project_name=Name AND Apply.Status='Accepted')/(SELECT COUNT(*) FROM Apply WHERE Apply.Project_name=Name)*100, 0), '%')
    AS Pct_acpted_applicants,
    CONCAT(
    (SELECT Major AS Count FROM Apply, User WHERE Username=Apply.Student_name AND Apply.Project_name=Name GROUP BY Major ORDER BY Count(*) DESC LIMIT 1),
    IFNULL(CONCAT(', ', (SELECT Major AS Count FROM Apply, User WHERE Username=Apply.Student_name AND Apply.Project_name=Name GROUP BY Major ORDER BY Count(*) DESC LIMIT 1, 1), ', '), ''),
    IFNULL((SELECT Major AS Count FROM Apply, User WHERE Username=Apply.Student_name AND Apply.Project_name=Name GROUP BY Major ORDER BY Count(*) DESC LIMIT 2, 1), '')
    )
    AS Majors
    FROM Project ORDER BY Pct_acpted_applicants DESC;
  `)
}

export const numApplications = () => query(`SELECT COUNT(*) AS cnt FROM Apply`)

export const numAcceptedApplications = () => query(`SELECT COUNT(*) AS cnt FROM Apply WHERE Status = 'Accepted'`)

export const mysqlEscapeString = (str) => {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
    switch (char) {
      case "\0":
          return "\\0";
      case "\x08":
          return "\\b";
      case "\x09":
          return "\\t";
      case "\x1a":
          return "\\z";
      case "\n":
          return "\\n";
      case "\r":
          return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
          return "\\"+char; // prepends a backslash to backslash, percent,
                            // and double/single quotes
    }
  })
}
