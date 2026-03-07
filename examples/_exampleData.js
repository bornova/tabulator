import { faker } from 'https://esm.sh/@faker-js/faker'

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export const generateData = (rowCount = 100) => {
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
      salary: faker.number.int({ min: 30000, max: 150000 }), // Generates a random salary
      address: faker.location.streetAddress(), // Generates a random street address
      state: faker.location.state(), // Generates a random state
      zip: parseInt(faker.location.zipCode(), 10), // Generates a random zip code
      progress: faker.number.int({ min: 0, max: 100 }), // Generates a random progress percentage
      completed: faker.datatype.boolean()
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
    salary: faker.number.int({ min: 30000, max: 150000 }),
    address: faker.location.streetAddress(),
    state: faker.location.state(),
    zip: parseInt(faker.location.zipCode(), 10),
    progress: faker.number.int({ min: 0, max: 100 }),
    completed: faker.datatype.boolean()
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
