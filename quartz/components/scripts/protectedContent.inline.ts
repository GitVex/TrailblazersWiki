import { parseComponentData, isAuthorized, getUser } from "./util"

function auth() {
  const user = getUser() ?? ""

  const parsedComponentData = parseComponentData() ?? ""
  const isUserAuthorized = isAuthorized(user, parsedComponentData)

  // Get unauthorized and authorized elements
  const unauthorized = document.getElementById("protected-content-unauthorized")
  const authorized = document.getElementById("protected-content-authorized")
  if (!unauthorized || !authorized) return

  if (isUserAuthorized) {
    unauthorized.style.display = "none"
    authorized.style.display = "block"
  } else {
    unauthorized.style.display = "block"
    authorized.style.display = "none"
  }
}

export function run_auth() {
  setInterval(() => auth(), 500)
}

run_auth()
