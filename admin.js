import express from 'express'
import * as adminDb from './admin_db.js'
import * as db from './db.js'
import { getErrorMessage } from './utils.js'

const router = express.Router()

router.get('/home', (req, res) => {
  res.render('admin_index.ejs')
})

router.get('/apps', (req, res) => {
  adminDb.getApplications()
    .then(rows => {
      res.render('admin_apps.ejs', { rows })
    })
})

router.post('/app', (req, res) => {
  adminDb.setApplicationStatus(req.body)
    .then(rows => {
      res.send()
    })
})

router.get('/projReport', (req, res) => {
  adminDb.popularProjects()
    .then(rows => {
      res.render('admin_projReport.ejs', { rows })
    })
})

router.get('/appReport', (req, res) => {
  Promise.all([
    adminDb.appReport(),
    adminDb.numApplications(),
    adminDb.numAcceptedApplications()
  ])
    .then(([rows, num, acceptNum]) => {
      res.render('admin_appReport.ejs', { rows, num: num[0], acceptNum: acceptNum[0] })
    })
})

router.route('/project')
  .get((req, res) => {
    Promise.all(
      [db.getCategories(), db.getDesignations(), db.getMajors(), db.getDepartments()]
    ).then(([rows, designations, majors, departments]) => {
      const categories = rows.map(row => row.Name)
      res.render('admin_project.ejs', {
        categories,
        designations: designations.map(row => row.Name),
        majors: majors.map(row => row.Name),
        departments: departments.map(row => row.Name),
      })
    }).catch(err => {
      res.send(getErrorMessage(err))
    })
  })
  .post((req, res) => {
    let categoryNum = 1
    const data = req.body
    let categories = []
    while (data[`category${categoryNum}`]) {
      categories.push(data[`category${categoryNum}`])
      categoryNum++
    }
    categories = Array.from(new Set(categories))
    data.categories = categories
    adminDb.addProject(data)
      .then(d => res.send('Project has been created!'))
      .catch(({ message }) => {
        console.log(message)
        res.send('Project name is taken')
      })
  })

router.route('/course')
  .get((req, res) => {
    Promise.all(
      [db.getCategories(), db.getDesignations()]
    ).then(([rows, designations]) => {
      const categories = rows.map(row => row.Name)
      res.render('admin_course.ejs', {
        categories,
        designations: designations.map(row => row.Name)
      })
    })
  })
  .post((req, res) => {
    let categoryNum = 1
    const data = req.body
    let categories = []
    while (data[`category${categoryNum}`]) {
      categories.push(data[`category${categoryNum}`])
      categoryNum++
    }
    categories = Array.from(new Set(categories))
    data.categories = categories
    adminDb.addCourse(data)
      .then(d => res.send('Course has been created!'))
      .catch(({ message }) => {
        res.send('Course name is taken')
      })
  })

export default router
