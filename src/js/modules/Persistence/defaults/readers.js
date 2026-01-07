// read persistance information from storage
export default {
	local: function (id, type) {
		const data = localStorage.getItem(id + '-' + type)

		return data ? JSON.parse(data) : false
	},
	cookie: function (id, type) {
		let cookie = document.cookie
		const key = id + '-' + type
		const cookiePos = cookie.indexOf(key + '=')
		let end
		let data

		// if cookie exists, decode and load column data into tabulator
		if (cookiePos > -1) {
			cookie = cookie.slice(cookiePos)

			end = cookie.indexOf(';')

			if (end > -1) {
				cookie = cookie.slice(0, end)
			}

			data = cookie.replace(key + '=', '')
		}

		return data ? JSON.parse(data) : false
	}
}
