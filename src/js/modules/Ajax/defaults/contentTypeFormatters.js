function generateParamsList(data, prefix = '') {
  let output = []

  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      output = output.concat(generateParamsList(item, prefix ? `${prefix}[${i}]` : i))
    })
  } else if (typeof data === 'object') {
    for (const key in data) {
      output = output.concat(generateParamsList(data[key], prefix ? `${prefix}[${key}]` : key))
    }
  } else {
    output.push({ key: prefix, value: data })
  }

  return output
}

export default {
  json: {
    headers: {
      'Content-Type': 'application/json'
    },
    body(url, config, params) {
      return JSON.stringify(params)
    }
  },
  form: {
    headers: {},
    body(url, config, params) {
      const output = generateParamsList(params)
      const form = new FormData()

      output.forEach((item) => {
        form.append(item.key, item.value)
      })

      return form
    }
  }
}
