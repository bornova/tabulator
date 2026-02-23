import { faker } from 'https://esm.sh/@faker-js/faker'

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export const generateData = (rowCount) => {
  const data = []

  for (let i = 1; i <= rowCount; i++) {
    data.push({
      id: i,
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 100 }),
      gender: faker.person.sex(), // Generates 'male' or 'female'
      rating: faker.number.int({ min: 1, max: 5 }),
      col: faker.color.human(), // Generates human-readable colors like 'red', 'blue'
      dob: formatDate(faker.date.birthdate({ min: 18, max: 65, mode: 'age' })),
      car: faker.vehicle.vehicle(), // Generates a random vehicle name
      address: faker.location.streetAddress(), // Generates a random street address
      state: faker.location.state(), // Generates a random state
      country: faker.location.country(), // Generates a random country
      progress: faker.number.int({ min: 0, max: 100 }) // Generates a random progress percentage
    })
  }

  return data
}

const createRow = (id) => {
  return {
    id,
    name: faker.person.fullName(),
    age: faker.number.int({ min: 18, max: 100 }),
    gender: faker.person.sex(),
    rating: faker.number.int({ min: 1, max: 5 }),
    col: faker.color.human(),
    dob: formatDate(faker.date.birthdate({ min: 18, max: 65, mode: 'age' })),
    car: faker.vehicle.vehicle(),
    address: faker.location.streetAddress(),
    state: faker.location.state(),
    country: faker.location.country(),
    progress: faker.number.int({ min: 0, max: 100 })
  }
}

const createRowWithChildren = (counter, depth, maxDepth, maxChildren) => {
  const row = createRow(counter.value++)

  if (depth < maxDepth) {
    const childCount = faker.number.int({ min: 0, max: maxChildren })

    if (childCount > 0) {
      row._children = []

      for (let i = 0; i < childCount; i++) {
        row._children.push(createRowWithChildren(counter, depth + 1, maxDepth, maxChildren))
      }
    }
  }

  return row
}

export const generateNestedData = (rowCount = 1, maxChildren = 4, maxDepth = 1) => {
  const data = []
  const counter = { value: 1 }

  for (let i = 0; i < rowCount; i++) {
    data.push(createRowWithChildren(counter, 0, maxDepth, maxChildren))
  }

  return data
}

export const initializeThemeSelector = () => {
  const themeStylesheet = document.getElementById('theme-stylesheet')

  if (!themeStylesheet) {
    return
  }

  if (!document.getElementById('theme-selector-style')) {
    const style = document.createElement('style')
    style.id = 'theme-selector-style'
    style.textContent = '.theme-selector{margin:0 0 10px;font-size:0.875rem}.theme-selector select{margin-left:6px}'
    document.head.appendChild(style)
  }

  let selector = document.getElementById('theme-select')

  if (!selector) {
    const wrapper = document.createElement('div')
    const label = document.createElement('label')
    selector = document.createElement('select')

    wrapper.className = 'theme-selector'
    label.htmlFor = 'theme-select'
    label.textContent = 'Theme:'

    selector.id = 'theme-select'
    selector.innerHTML = '<option value="light">Light</option><option value="dark">Dark</option>'

    wrapper.appendChild(label)
    wrapper.appendChild(selector)

    const firstTable = document.querySelector('[id^="example-table"]')
    if (firstTable) {
      firstTable.parentNode.insertBefore(wrapper, firstTable)
    } else {
      document.body.insertBefore(wrapper, document.body.firstChild)
    }
  }

  const themeMatch = themeStylesheet.href.match(/\/themes\/default\/(light|dark)\/tabulator(\.min)?\.css$/)
  const currentTheme = themeMatch ? themeMatch[1] : 'light'

  selector.value = currentTheme

  selector.addEventListener('change', (event) => {
    const nextTheme = event.target.value
    themeStylesheet.href = `./../../dist/css/themes/default/${nextTheme}/tabulator.min.css`
  })
}
