import express from 'express'
import bodyParser from 'body-parser'
import * as db from './db.js'
import { getErrorMessage } from './utils.js'
import adminRoutes from './admin.js'

const app = express()
const portNum = process.env.PORT || 8080

let username = 'joewang704'

app.set('views', `${__dirname}/views`)
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs')

app.use('/static', express.static(`${__dirname}/static`))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/admin', adminRoutes)

app.get('/', (req, res) => {
  res.redirect('/login')
})

app.route('/login')
  .get((req, res) => {
    res.render('login.ejs', { err: getErrorMessage(req.query.err) })
  })
  .post((req, res) => {
    db.login(req.body)
      .then(users => {
        if (users.length == 0) {
          return res.redirect('/login?err=INCORRECT_LOGIN')
        }
        username = req.body.username
        const userType = users[0].UserType
        if (userType === 'Student') {
          return res.redirect('/home')
        }
        return res.redirect('/admin/home')
      })
      .catch(({ message }) => {
        return res.redirect(`/login?err=${message}`)
      })
  })

app.route('/register')
  .get((req, res) => {
    res.render('register.ejs', { err: getErrorMessage(req.query.err) })
  })
  .post((req, res) => {
    if (req.body.password !== req.body['confirm-password']) {
      return res.redirect('/register?err=PW_MATCH')
    }
    db.register(req.body)
      .then(rows => {
        return res.redirect('/home')
      })
      .catch(({ message }) => {
        return res.redirect(`/register?err=${message}`)
      })
  })

app.route('/home')
  .get((req, res) => {
    Promise.all([db.getCategories(), db.getDesignations(), db.getMajors(), db.search({ type: 'Both' })])
      .then(([categoriesObj, designationsObj, majorsObj, results]) => {
        const categories = categoriesObj.map(row => row.Name)
        const designations = designationsObj.map(row => row.Name)
        const majors = majorsObj.map(row => row.Name)
        res.render('index.ejs', { categories, designations, majors, results })
      })
      .catch(console.log)
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
    db.search(data).then(rows => {
      res.send(rows)
    }).catch(console.log)
  })

app.get('/me', (req, res) => {
  res.render('me.html')
})

app.route('/profile')
  .get((req, res) => {
    Promise.all([db.editProfileInfo({ username }), db.getMajors()])
      .then(([users, majors]) => {
        res.render('profile.ejs', { user: users[0], majors: majors.map(row => row.Name) })
      })
  })
  .post((req, res) => {
    const { major, year } = req.body
    db.updateProfile({ username, major, year })
      .then((r) => {
        res.redirect('/profile')
      })
  })

app.get('/apps', (req, res) => {
  db.getApplicationsFromUser({ username })
    .then(rows => {
      res.render('apps.ejs', { rows })
    })
})

app.route('/project/:name')
  .get((req, res) => {
    const name = req.params.name
    Promise.all([
      db.getProject({ name }),
      db.getProjectCategories({ name }),
      db.getProjectRequirements({ name }),
      db.checkProjectStatus({ name, username })
    ])
      .then(([projects, categories, requirements, status]) => {
        console.log(status)
        res.render('project.ejs', {
          project: projects[0],
          categories: categories.map(row => row.Category_name),
          requirements: requirements && requirements.length > 0 ? Object.values(requirements[0]).filter(r => r) : [],
          status,
        })
      })
      .catch(console.log)
  })

app.get('/createProject/:name', (req, res) => {
  const name = req.params.name
  db.applyProject({ username, name })
    .then(row => {
      res.redirect('/apps')
    })
    .catch(console.log)
})

app.get('/course/:name', (req, res) => {
  const name = req.params.name
  Promise.all([db.getCourse({ name }), db.getCourseCategories({ name })])
    .then(([courses, categories]) => {
      console.log(courses)
      console.log(categories)
      res.render('course.ejs', {
        course: courses[0],
        categories: categories.map(row => row.Category_name)
      })
    })
})

app.listen(portNum, () => {
  if (!process.env.PORT) {
    console.log('Serving port number ' + portNum)
  }
})

